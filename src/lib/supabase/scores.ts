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

interface TopScoresState {
  gameId: string;
  rows: ScoreEntry[] | null;
  error: boolean;
}

export function useTopScores(gameId: string, limit = 10) {
  const [state, setState] = useState<TopScoresState>({
    gameId: "",
    rows: null,
    error: false,
  });
  const [attempt, setAttempt] = useState(0);

  const reload = () => setAttempt((a) => a + 1);

  useEffect(() => {
    let stale = false;

    fetchTopScores(gameId, limit)
      .then((rows) => {
        if (stale) return; // ignore stale responses on fast tab switches
        setState({ gameId, rows, error: false });
      })
      .catch(() => {
        if (stale) return;
        setState({ gameId, rows: null, error: true });
      });

    return () => {
      stale = true;
    };
  }, [gameId, limit, attempt]);

  // Derived: loading while the stored result doesn't match the requested game.
  const loading = state.gameId !== gameId;
  const rows = loading ? null : state.rows;
  const error = !loading && state.error;

  return { rows, loading, error, reload };
}

interface AllBestsState {
  bests: Record<string, number> | null;
  error: boolean;
  loaded: boolean;
}

export function useAllBests() {
  const [state, setState] = useState<AllBestsState>({
    bests: null,
    error: false,
    loaded: false,
  });
  const [attempt, setAttempt] = useState(0);

  const reload = () => setAttempt((a) => a + 1);

  useEffect(() => {
    let stale = false;

    fetchAllBests()
      .then((bests) => {
        if (stale) return;
        setState({ bests, error: false, loaded: true });
      })
      .catch(() => {
        if (stale) return;
        setState({ bests: null, error: true, loaded: true });
      });

    return () => {
      stale = true;
    };
  }, [attempt]);

  const loading = !state.loaded;
  const bests = state.bests;
  const error = !loading && state.error;

  return { bests, loading, error, reload };
}
