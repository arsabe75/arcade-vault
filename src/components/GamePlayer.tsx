"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES } from "@/src/data/games";
import GameOverModal from "./GameOverModal";

export default function GamePlayer({ id }: { id: string }) {
  const router = useRouter();
  const game = GAMES.find((g) => g.id === id);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [playerName, setPlayerName] = useState("INVITADO");

  // Load player name from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("av_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) setPlayerName(parsed.name.toUpperCase());
      }
    } catch {
      /* no disponible */
    }
  }, []);

  // Score simulation
  useEffect(() => {
    if (over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [over, paused]);

  // Level up
  useEffect(() => {
    if (score > 0 && score % 2500 < 100) setLevel((l) => l + 1);
  }, [score]);

  const endGame = useCallback(() => setOver(true), []);
  const restart = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
  }, []);

  const handleExit = useCallback(() => {
    router.push("/");
  }, [router]);

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
          <Link href="/">← VOLVER AL VAULT</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="av-player fade-in">
      {/* HUD */}
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {playerName}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">
              {"♥ ".repeat(lives).trim() || "—"}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/juego/${game.id}`}>
            <button className="btn ghost">SALIR</button>
          </Link>
        </div>
      </div>

      {/* CRT Screen */}
      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
            <div className="player-ship" />
          </div>
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div
                  className="pixel neon-yellow"
                  style={{ fontSize: 22 }}
                >
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {/* Game Over Modal */}
      {over && (
        <GameOverModal
          score={score}
          gameId={game.id}
          onRestart={restart}
          onExit={handleExit}
        />
      )}
    </div>
  );
}
