"use client";

import { useEffect, useRef } from "react";
import { TetrisEngine } from "@/src/games/caida/engine";
import type { GameEngineProps } from "@/src/games/registry";

// Wrapper React del motor: el canvas se monta una vez, el motor se instancia
// en useEffect con cleanup, y la pausa llega como prop. Los callbacks se
// reenvían sin procesar. (SPEC 07 — Data model)
export default function TetrisGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onTripleShot,
  onGameOver,
  onLines,
}: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TetrisEngine | null>(null);

  // Montaje: instancia el motor y arranca el loop. Cleanup: destroy().
  // Los callbacks son setters estables de GamePlayer, por eso el motor se
  // monta una única vez y el efecto no depende de las props. Idempotente:
  // StrictMode monta/desmonta dos veces en dev sin dejar estado residual.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    engineRef.current = new TetrisEngine(ctx, {
      onScore,
      onLives,
      onLevel,
      onTripleShot,
      onGameOver,
      onLines,
    });

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pausa: el motor congela el loop (no update ni draw).
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) engine.pause();
    else engine.resume();
  }, [paused]);

  return (
    <canvas ref={canvasRef} width={800} height={600} className="game-canvas" />
  );
}
