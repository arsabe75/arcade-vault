"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES } from "@/src/data/games";
import {
  getGameEngine,
  type HudStat,
  type HudStatKey,
} from "@/src/games/registry";
import GameOverModal from "./GameOverModal";

// HUD de los juegos simulados: replica la configuración actual para que el
// loop genérico del HUD pinte la simulación igual que antes del registry.
const SIM_HUD: HudStat[] = [
  { key: "score", label: "Puntuación", initial: 0 },
  { key: "lives", label: "Vidas", initial: 3 },
  { key: "level", label: "Nivel", initial: 1 },
];

// Render del valor de cada stat (formato de número, corazones, padStart…).
// La config del registry solo dice QUÉ se muestra; el CÓMO vive aquí.
function renderStatValue(key: HudStatKey, value: number | null): string {
  if (value === null) return "—";
  switch (key) {
    case "score":
      return value.toLocaleString("es-ES");
    case "lives":
      return "♥ ".repeat(value).trim() || "—";
    case "level":
      return String(value).padStart(2, "0");
    case "lines":
      return String(value);
    case "triple":
      return `3x ${value.toFixed(1)}s`;
  }
}

export default function GamePlayer({ id }: { id: string }) {
  const router = useRouter();
  const game = GAMES.find((g) => g.id === id);
  const entry = game ? getGameEngine(game.id) : undefined;
  const EngineComponent = entry?.component; // mayúscula: obligatorio para JSX
  const hud = entry?.hud ?? SIM_HUD;

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [playerName, setPlayerName] = useState("INVITADO");
  const [triple, setTriple] = useState<number | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  // Setters estables de React → mapa tipado por clave de stat.
  // El mapa solo se usa en restart() con `initial` (número); los setters
  // numéricos descartan el null del tipo común con `?? 0`.
  const statSetters = useMemo<Record<HudStatKey, (v: number | null) => void>>(
    () => ({
      score: (v) => setScore(v ?? 0),
      lives: (v) => setLives(v ?? 0),
      level: (v) => setLevel(v ?? 0),
      lines: (v) => setLines(v ?? 0),
      triple: setTriple,
    }),
    [],
  );

  const statValues: Record<HudStatKey, number | null> = {
    score,
    lives,
    level,
    lines,
    triple,
  };

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

  // Score simulation (solo juegos sin motor real)
  useEffect(() => {
    if (entry || over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [entry, over, paused]);

  // Level up (solo juegos simulados)
  useEffect(() => {
    if (entry) return;
    if (score > 0 && score % 2500 < 100) setLevel((l) => l + 1);
  }, [entry, score]);

  const endGame = useCallback(() => setOver(true), []);

  // Game over real del motor: sincroniza la puntuación final y abre el modal.
  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setOver(true);
  }, []);

  const restart = useCallback(() => {
    for (const s of hud) statSetters[s.key](s.initial);
    setTriple(null);
    setPaused(false);
    setOver(false);
    setRestartKey((k) => k + 1); // remonta el motor limpio
  }, [hud, statSetters]);

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
          {hud.map((s) => {
            const value = statValues[s.key];
            if (s.conditional && value === null) return null;
            return (
              <div className={`hud-stat ${s.key}`} key={s.key}>
                <div className="l">{s.label}</div>
                <div className="v">{renderStatValue(s.key, value)}</div>
              </div>
            );
          })}
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
            {entry && EngineComponent && !over && (
              // El motor real se desmonta al terminar (el modal cubre la arena)
              <EngineComponent
                key={restartKey}
                paused={paused}
                onScore={setScore}
                onLives={setLives}
                onLevel={setLevel}
                onTripleShot={setTriple}
                onGameOver={handleGameOver}
                onLines={setLines}
              />
            )}
            {!entry && (
              <>
                <div className="grid-floor" />
                <div className="enemy e1" />
                <div className="enemy e2" />
                <div className="enemy e3" />
                <div className="player-ship" />
              </>
            )}
          </div>
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
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
