"use client";

import { useEffect, useState } from "react";

import { createClient } from "./client";

export interface ScoreEntry {
  id: string;
  game_id: string;
  initials: string;
  score: number;
  user_id: string | null;
  created_at: string;
}

/** "DD/MM/YYYY" with es-ES locale. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES");
}

export async function fetchTopScores(
  gameId: string,
  limit = 10,
): Promise<ScoreEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true }) // tie-break: oldest score ranks better
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ScoreEntry[];
}

export async function fetchAllBests(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("game_id, score");

  if (error) throw error;

  const bests: Record<string, number> = {};
  for (const row of (data ?? []) as { game_id: string; score: number }[]) {
    if (bests[row.game_id] === undefined || row.score > bests[row.game_id]) {
      bests[row.game_id] = row.score;
    }
  }
  return bests;
}

export async function insertScore(
  gameId: string,
  initials: string,
  score: number,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, initials, score });

  if (error) throw error;
}

export function useTopScores(gameId: string, limit = 10) {
  const [rows, setRows] = useState<ScoreEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const reload = () => setAttempt((a) => a + 1);

  useEffect(() => {
    let stale = false;

    setRows(null); // null = still loading
    setLoading(true);
    setError(false);

    fetchTopScores(gameId, limit)
      .then((data) => {
        if (stale) return; // ignore stale responses on fast tab switches
        setRows(data);
        setLoading(false);
      })
      .catch(() => {
        if (stale) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [gameId, limit, attempt]);

  return { rows, loading, error, reload };
}

export function useAllBests() {
  const [bests, setBests] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const reload = () => setAttempt((a) => a + 1);

  useEffect(() => {
    let stale = false;

    setLoading(true);
    setError(false);

    fetchAllBests()
      .then((data) => {
        if (stale) return;
        setBests(data);
        setLoading(false);
      })
      .catch(() => {
        if (stale) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [attempt]);

  return { bests, loading, error, reload };
}
