"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { GAMES, seededScores, type ScoreRow } from "@/src/data/games";
import Button from "./Button";
import Podium from "./Podium";

function formatScore(n: number): string {
  return n.toLocaleString("en-US");
}

function topClass(rank: number): string {
  if (rank === 1) return "top1";
  if (rank === 2) return "top2";
  if (rank === 3) return "top3";
  return "";
}

export default function HallOfFame() {
  const [gameIdx, setGameIdx] = useState(0);
  const [yourBest, setYourBest] = useState<{
    initials: string;
    score: number;
  } | null>(null);

  const game = GAMES[gameIdx] ?? GAMES[0];

  // Load user's best score for this game from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("av_scores");
      if (raw) {
        const all = JSON.parse(raw) as Record<
          string,
          { initials: string; score: number }[]
        >;
        const list = all[game.id];
        if (list && list.length > 0) {
          const best = list.reduce((a, b) => (b.score > a.score ? b : a));
          setYourBest(best);
          return;
        }
      }
    } catch {
      /* no disponible */
    }
    setYourBest(null);
  }, [game.id]);

  const allScores: ScoreRow[] = useMemo(() => {
    return seededScores(game.best, 12);
  }, [game.best]);

  const top3 = allScores.slice(0, 3);

  // Merge your best into the list if it's not already represented
  const hasYourEntry =
    yourBest &&
    allScores.some(
      (r) => r.name === yourBest.initials && r.score === yourBest.score,
    );

  return (
    <div className="av-hall fade-in">
      {/* Header */}
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="mono">LAS MEJORES PUNTUACIONES DEL ARCADE VAULT</p>
      </div>

      {/* Game tabs */}
      <div className="hall-tabs">
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            className={`chip${i === gameIdx ? " active" : ""}`}
            onClick={() => setGameIdx(i)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {/* Podium */}
      <Podium top3={top3} />

      {/* Table */}
      <div className="hall-table">
        <div className="th">
          <span>#</span>
          <span>JUGADOR</span>
          <span>PUNTUACIÓN</span>
          <span>FECHA</span>
        </div>

        {allScores.map((r, i) => (
          <div
            key={r.rank}
            className={`tr ${topClass(r.rank)}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="rk">
              {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
            </span>
            <span className="pl">{r.name}</span>
            <span className="sc">{formatScore(r.score)}</span>
            <span className="dt">{r.date}</span>
          </div>
        ))}

        {/* Your best row */}
        {yourBest && !hasYourEntry && (
          <>
            <div className="tr you-label">TU MEJOR MARCA</div>
            <div className="tr you">
              <span className="rk">—</span>
              <span className="pl">{yourBest.initials}</span>
              <span className="sc">{formatScore(yourBest.score)}</span>
              <span className="dt">—</span>
            </div>
          </>
        )}
      </div>

      {/* Back button */}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/">
          <Button variant="ghost">← VOLVER AL VAULT</Button>
        </Link>
      </div>
    </div>
  );
}
