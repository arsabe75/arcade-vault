"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import type { Game } from "@/src/data/games";

const COVER_CLASS: Record<string, string> = {
  "space-lancers": "cover-rocas",
  "neon-kombat": "cover-duelo",
  "crystal-maze": "cover-tetro",
  "star-raiders": "cover-bricks",
  "void-hunters": "cover-rana",
  "hex-invaders": "cover-invaders",
  "quantum-drift": "cover-glot",
  "cyber-solitaire": "cover-snake",
};

function formatScore(n: number): string {
  return n.toLocaleString("en-US");
}

export default function GameCard({ game }: { game: Game }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rx = (y / rect.height) * 12;
    const ry = -(x / rect.width) * 12;
    el.style.transform = `perspective(600px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  }, []);

  return (
    <Link href={`/juego/${game.id}`} style={{ display: "block" }}>
      <div
        ref={ref}
        className="card"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div className="cover">
          <span className="label">{game.cat}</span>
          <div className={`cover-bg ${COVER_CLASS[game.cover] ?? "cover-bricks"}`} />
        </div>
        <div className="meta">
          <div className="title">{game.title}</div>
          <div className="desc">{game.short}</div>
          <div className="row">
            <div className="score-badge">
              HIGH SCORE <b>{formatScore(game.best)}</b>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
