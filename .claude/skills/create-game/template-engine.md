# template-engine.md — Esqueleto del motor

Copia este código a `src/games/<id>/engine.ts` y sustituye `__Name__Engine` por el nombre real (p. ej. `TetrisEngine`).

- **Port de una referencia**: además de este esqueleto, aplica la checklist completa de la Fase 3 del SKILL.md (constantes copiadas literalmente, sin HUD en canvas, paleta neón, sin restart con tecla…).
- **Desde cero**: este esqueleto ya resuelve el contrato de la plataforma; rellena solo la lógica del juego en los `TODO`.

```ts
// ── Motor de <NOMBRE> ──────────────────────────────────────────────────────────
// [PORT: Port fiel de references/started-games/XX-nombre/game.js | DESDE CERO:
//  creado sin referencia] a TypeScript puro (strict mode, sin `any`).
// Sin dependencias de React ni del DOM: recibe el contexto del canvas por
// parámetro y expone callbacks para que el HUD de React sea la única fuente
// de verdad. (SPEC 05 — Data model)
//
// Checklist del port (referencia → motor). Con ★: también aplican desde cero.
//   1. TypeScript puro estricto, sin `any`, sin imports de React/DOM.
//   2. Loop con requestAnimationFrame y dt en segundos con cap a 0.05s. ★
//   3. Callbacks SOLO cuando cambia el valor (al sumar puntos, al perder vida,
//      al cambiar nivel) — nunca por frame. ★
//   4. Entidades como clases con update(dt) y draw(ctx).
//   5. Canvas siempre 800×600: tableros menores se dibujan centrados/escalados
//      dentro, sin tocar las constantes lógicas del original. ★
//   6. Sin reinicio con tecla en gameover: lo controla el GameOverModal. ★
//   7. Sin HUD ni overlays dentro del canvas: solo la acción. ★
//   8. Paleta neón de Arcade Vault: cyan #00ffff, amarillo #f5ff00,
//      magenta #ff00ff. Sprites PNG → dibujo vectorial. ★
//   9. preventDefault() en las teclas del juego durante playing/dead. ★
//  10. Fuera: pausa con tecla, toggles de tema, sonido.
//  11. Constantes del original copiadas literalmente (no "corregir" el juego).
//  12. destroy(): cancelAnimationFrame + removeEventListener, con guard destroyed. ★
//  13. Listeners de teclado a nivel window (keydown/keyup). ★

import type { EngineCallbacks } from "@/src/games/registry";

export const W = 800;
export const H = 600;

export type GameState = "playing" | "dead" | "gameover";

// Teclas del juego: reciben preventDefault durante la partida
// (no hacen scroll ni re-activan botones enfocados del HUD).
const GAME_KEYS: readonly string[] = ["ArrowLeft", "ArrowRight"];

// ── Entidades ───────────────────────────────────────────────────────────────────
// TODO: clases del juego (pieza, bloque, paleta, bala…), cada una con
// update(dt: number): void y draw(ctx: CanvasRenderingContext2D): void.

// ── Motor ───────────────────────────────────────────────────────────────────────
export class __Name__Engine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly callbacks: EngineCallbacks;
  // Si el juego usa stats extra (p. ej. líneas del tetris), amplía el tipo aquí:
  // private readonly callbacks: EngineCallbacks & { onLines?(lines: number): void };

  // Input
  private readonly keys: Record<string, boolean> = {};
  private readonly justPressed: Record<string, boolean> = {};

  // Estado del juego
  private score = 0;
  private lives = 3;
  private level = 1;
  private state: GameState = "playing";
  // TODO: arrays de entidades

  // Loop
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private paused = false;
  private destroyed = false;

  constructor(ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks) {
    this.ctx = ctx;
    this.callbacks = callbacks;
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.initGame();
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  // ── Input ──
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.keys[e.code]) this.justPressed[e.code] = true;
    this.keys[e.code] = true;
    // Las teclas del juego no hacen scroll ni re-activan botones del HUD.
    if (
      GAME_KEYS.includes(e.code) &&
      (this.state === "playing" || this.state === "dead")
    ) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
  };

  /** Edge-trigger: true una sola vez por pulsación. */
  private pressed(code: string): boolean {
    const val = this.justPressed[code];
    this.justPressed[code] = false;
    return val;
  }

  // ── Estado del juego ──
  private initGame(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.state = "playing";
    // TODO: crear entidades iniciales
  }

  private killShip(): void {
    this.lives--;
    this.callbacks.onLives(this.lives); // callback SOLO en la transición
    if (this.lives <= 0) {
      this.state = "gameover";
      this.callbacks.onGameOver(this.score);
    } else {
      this.state = "dead";
      // TODO: temporizador de reaparición; al terminar → playing + reset
    }
  }

  // ── Update ──
  private update(dt: number): void {
    // En gameover no se reinicia con tecla: lo controla el GameOverModal.
    if (this.state === "gameover") return;

    if (this.state === "dead") {
      // TODO: cuenta atrás de reaparición
      return;
    }

    // TODO: lógica del juego. Reglas:
    // - onScore(this.score) SOLO al sumar puntos.
    // - onLives(this.lives) SOLO al perder vida (killShip).
    // - onLevel(this.level) SOLO al cambiar de nivel.
    // - Si hay temporizador con decimales (p. ej. powerup 3x), notificar
    //   SOLO cuando cambia su valor redondeado a 1 decimal (ver
    //   src/games/asteroids/engine.ts, lastTripleSeconds).
  }

  // ── Draw ──
  private draw(): void {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, W, H);
    // TODO: dibujar solo la acción (nada de HUD ni overlays).
  }

  // ── Loop principal ──
  private loop = (ts: number): void => {
    if (this.destroyed) return;
    const dt =
      this.lastTime === null ? 0 : Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    if (!this.paused) {
      this.update(dt);
      this.draw();
    }
    this.rafId = requestAnimationFrame(this.loop);
  };
}
```
