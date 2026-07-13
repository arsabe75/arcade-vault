"use client";

import Link from "next/link";
import { GAMES, seededScores, type Game } from "@/src/data/games";
import Button from "./Button";
import Leaderboard from "./Leaderboard";

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

function formatPlays(n: string): string {
  return n;
}

export default function GameDetail({ id }: { id: string }) {
  const game: Game | undefined = GAMES.find((g) => g.id === id);

  if (!game) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "120px 20px",
          fontFamily: "var(--pixel)",
          fontSize: 14,
          letterSpacing: "0.16em",
          color: "var(--magenta)",
          textShadow: "0 0 12px rgba(255,0,110,0.5)",
        }}
      >
        JUEGO NO ENCONTRADO
        <div style={{ marginTop: 24 }}>
          <Link href="/">
            <Button variant="cyan">← VOLVER AL VAULT</Button>
          </Link>
        </div>
      </div>
    );
  }

  const scores = seededScores(game.best);

  const neonClass =
    game.color === "cyan"
      ? "neon-cyan"
      : game.color === "magenta"
        ? "neon-magenta"
        : game.color === "yellow"
          ? "neon-yellow"
          : "neon-green";

  return (
    <div className="av-detail fade-in">
      {/* Left column */}
      <div>
        <div className="detail-cover">
          <div
            className="cover-bg"
            style={{ position: "absolute", inset: 0 }}
          >
            <div
              className={`cover-bg ${COVER_CLASS[game.cover] ?? "cover-bricks"}`}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
          <span
            className="label"
            style={{
              position: "absolute",
              left: 8,
              bottom: 8,
              zIndex: 2,
              fontFamily: "var(--pixel)",
              fontSize: 8,
              padding: "4px 6px",
              background: "rgba(0,0,0,0.6)",
              color: "var(--cyan)",
              border: "1px solid var(--line)",
            }}
          >
            {game.cat}
          </span>
        </div>
      </div>

      {/* Right column */}
      <div className="detail-info">
        <div className="detail-tags">
          <span>{game.cat}</span>
          <span>{game.plays} PARTIDAS</span>
        </div>

        <h2 className={neonClass}>{game.title}</h2>

        <div className="stat-strip">
          <div>
            <div className="l">PARTIDAS</div>
            <div className="v">{formatPlays(game.plays)}</div>
          </div>
          <div>
            <div className="l">MEJOR GLOBAL</div>
            <div className="v">{formatScore(game.best)}</div>
          </div>
          <div>
            <div className="l">DIFICULTAD</div>
            <div className="v">
              {game.cat === "SHOOTER" ? "ALTA" : game.cat === "VERSUS" ? "MEDIA" : "MEDIA"}
            </div>
          </div>
        </div>

        <p>{game.long}</p>

        <div className="detail-actions">
          <Link href={`/jugar/${game.id}`}>
            <Button variant="cyan" size="lg" pulse>
              ▶ JUGAR AHORA
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">← VOLVER</Button>
          </Link>
        </div>
      </div>

      {/* Leaderboard (full width below on desktop, natural on mobile) */}
      <div style={{ gridColumn: "1 / -1" }}>
        <Leaderboard rows={scores} />
      </div>
    </div>
  );
}
