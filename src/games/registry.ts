"use client";

import type { ComponentType } from "react";
import AsteroidsGame from "@/src/components/AsteroidsGame";
import TetrisGame from "@/src/components/TetrisGame";

// ── Contrato común motor ↔ React (SPEC 05) ─────────────────────────────────────
// Vive aquí y no en un engine concreto porque es el contrato de la PLATAFORMA.
// Los motores y wrappers lo importan SIEMPRE con `import type` (borrado en
// runtime) para no crear ciclos: registry → wrapper → engine → registry.
export interface EngineCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onTripleShot(secondsLeft: number | null): void; // null cuando el powerup expira
  onGameOver(score: number): void;
}

/** Props que acepta CUALQUIER wrapper de juego. Los juegos que no usan un
 *  callback simplemente no lo desestructuran (p. ej. caida ignora onLives). */
export interface GameEngineProps extends EngineCallbacks {
  paused: boolean;
  onLines?(lines: number): void; // solo juegos con líneas (caida)
}

// ── Configuración del HUD ──────────────────────────────────────────────────────
// GamePlayer pinta "Jugador" + estas stats en orden. El render de cada clave
// (formato de número, corazones, padStart…) vive en GamePlayer, no aquí:
// un switch pequeño y tipado; la config solo dice QUÉ se muestra.
// Añadir una stat nueva = 1 línea en HudStatKey + 1 caso en el switch.
export type HudStatKey = "score" | "lives" | "level" | "lines" | "triple";

export interface HudStat {
  key: HudStatKey;
  label: string;
  initial: number;
  /** Solo se renderiza cuando el valor no es null (temporizador 3x). */
  conditional?: boolean;
}

export interface GameEngineEntry {
  component: ComponentType<GameEngineProps>;
  hud: HudStat[];
}

// ── Registro ───────────────────────────────────────────────────────────────────
export const GAME_ENGINES: Record<string, GameEngineEntry> = {
  rocas: {
    component: AsteroidsGame,
    hud: [
      { key: "score", label: "Puntuación", initial: 0 },
      { key: "lives", label: "Vidas", initial: 3 },
      { key: "level", label: "Nivel", initial: 1 },
      { key: "triple", label: "PowerUp", initial: 0, conditional: true },
    ],
  },
  caida: {
    component: TetrisGame,
    hud: [
      { key: "score", label: "Puntuación", initial: 0 },
      { key: "lines", label: "Líneas", initial: 0 },
      { key: "level", label: "Nivel", initial: 1 },
    ],
  },
};

export function getGameEngine(id: string): GameEngineEntry | undefined {
  return GAME_ENGINES[id];
}
