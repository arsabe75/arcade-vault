"use client";

import { useEffect, useRef } from "react";
import { AsteroidsEngine } from "@/src/games/asteroids/engine";
import type { GameEngineProps } from "@/src/games/registry";

export default function AsteroidsGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onTripleShot,
  onGameOver,
}: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);

  // Montaje: instancia el motor y arranca el loop. Cleanup: destroy().
  // Los callbacks son setters estables de GamePlayer, por eso el motor se
  // monta una única vez y el efecto no depende de las props.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    engineRef.current = new AsteroidsEngine(ctx, {
      onScore,
      onLives,
      onLevel,
      onTripleShot,
      onGameOver,
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
