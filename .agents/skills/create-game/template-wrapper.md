# template-wrapper.md — Esqueleto del wrapper React

Copia este código a `src/components/<Name>Game.tsx` y sustituye `__Name__Engine` / `__Name__Game` por los nombres reales (p. ej. `TetrisEngine` / `TetrisGame`). Espejo de `src/components/AsteroidsGame.tsx` (SPEC 05).

- El import del registry es **solo de tipo** (`import type`): el ciclo registry → wrapper → engine → registry se rompe en tiempo de compilación.
- Si el juego usa stats extra (p. ej. `onLines` del tetris), añádelas a la desestructuración y al objeto de callbacks; los juegos que no las usan las ignoran.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { __Name__Engine } from "@/src/games/<id>/engine";
import type { GameEngineProps } from "@/src/games/registry";

// Wrapper React del motor: el canvas se monta una vez, el motor se instancia
// en useEffect con cleanup, y la pausa llega como prop. Los callbacks se
// reenvían sin procesar.
export default function __Name__Game({
  paused,
  onScore,
  onLives,
  onLevel,
  onTripleShot,
  onGameOver,
}: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<__Name__Engine | null>(null);

  // Montaje: instancia el motor y arranca el loop. Cleanup: destroy().
  // Los callbacks son setters estables de GamePlayer, por eso el motor se
  // monta una única vez y el efecto no depende de las props. Idempotente:
  // StrictMode monta/desmonta dos veces en dev sin dejar estado residual.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    engineRef.current = new __Name__Engine(ctx, {
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
```
