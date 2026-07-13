"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES } from "@/src/data/games";
import Button from "./Button";
import GameOverModal from "./GameOverModal";

export default function GamePlayer({ id }: { id: string }) {
  const router = useRouter();
  const game = GAMES.find((g) => g.id === id);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playerName, setPlayerName] = useState("JUGADOR 1");

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
    if (paused || gameOver) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setScore((prev) => {
        const next = prev + Math.floor(Math.random() * 120) + 30;

        // Level up every 2500 points
        const newLevel = Math.floor(next / 2500) + 1;
        if (newLevel > level) setLevel(newLevel);

        // Simulate losing a life occasionally
        if (next > 0 && next % 8000 < 60 && lives > 0) {
          setLives((l) => {
            const nl = l - 1;
            if (nl <= 0) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              // Delay game over slightly so score updates first
              setTimeout(() => setGameOver(true), 200);
            }
            return nl;
          });
        }

        return next;
      });
    }, 120);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, gameOver, level, lives]);

  const handlePause = useCallback(() => setPaused((v) => !v), []);
  const handleEnd = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setGameOver(true);
    setPaused(false);
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setLevel(1);
    setLives(3);
    setPaused(false);
    setGameOver(false);
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
          <Link href="/">
            <Button variant="cyan">← VOLVER AL VAULT</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="av-player fade-in">
      {/* HUD */}
      <div className="player-hud">
        <div className="hud-stat">
          <span className="l">JUGADOR</span>
          <span className="v">{playerName}</span>
        </div>
        <div className="hud-stat">
          <span className="l">PUNTUACIÓN</span>
          <span className="v">{score.toLocaleString("en-US")}</span>
        </div>
        <div className="hud-stat lives">
          <span className="l">VIDAS</span>
          <span className="v">
            {Array.from({ length: lives }, (_, i) => (
              <span key={i}>♥ </span>
            ))}
            {lives === 0 && "—"}
          </span>
        </div>
        <div className="hud-stat level">
          <span className="l">NIVEL</span>
          <span className="v">{level}</span>
        </div>
        <div className="hud-actions">
          <Button variant="yellow" size="default" onClick={handlePause}>
            {paused ? "▶ REANUDAR" : "⏸ PAUSA"}
          </Button>
          <Button variant="magenta" size="default" onClick={handleEnd}>
            ⏹ FIN
          </Button>
          <Link href="/">
            <Button variant="ghost" size="default">
              ✕ SALIR
            </Button>
          </Link>
        </div>
      </div>

      {/* CRT Screen */}
      <div className="crt">
        <div className="crt-screen">
          <div className="crt-content">
            <div className="game-arena">
              {/* Grid floor */}
              <div className="grid-floor" />

              {/* Player ship */}
              <div className="player-ship" />

              {/* Enemies */}
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />

              {/* Pause overlay */}
              {paused && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.7)",
                    zIndex: 10,
                    fontFamily: "var(--pixel)",
                    fontSize: 20,
                    color: "var(--yellow)",
                    textShadow: "0 0 12px rgba(245,255,0,0.7)",
                    letterSpacing: "0.2em",
                  }}
                >
                  EN PAUSA
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CRT bottom bar */}
        <div className="crt-bottom">
          <span className="led">ON AIR</span>
          <span>ARCADE VAULT · {game.title}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>
            {new Date().toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <GameOverModal
          score={score}
          gameId={game.id}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}
    </div>
  );
}
