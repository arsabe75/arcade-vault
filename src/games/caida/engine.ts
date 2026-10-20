// ── Motor de Tetris (CAÍDA) ─────────────────────────────────────────────────────
// Port fiel de references/started-games/03-tetris/game.js a TypeScript puro
// (strict mode, sin `any`). Sin dependencias de React ni del DOM: recibe el
// contexto del canvas por parámetro y expone callbacks para que el HUD de React
// sea la única fuente de verdad. (SPEC 07 — Data model)
//
// Únicos 9 cambios respecto al original:
//   1. Sin tecla `P` de pausa — la pausa la controla el botón del HUD.
//   2. Sin HUD interno del canvas (`updateHUD` sobre el DOM): React vía callbacks.
//   3. Sin overlay interno de PAUSA/GAME OVER: los pinta React.
//   4. Sin botón de reinicio ni restart con tecla en gameover: lo controla el GameOverModal.
//   5. Sin theme toggle claro/oscuro: tema neón fijo.
//   6. Canvas único 800×600: tablero 300×600 centrado + pieza siguiente en el lateral.
//   7. Paleta pastel → neón conservando el color por pieza.
//   8. `preventDefault()` en las teclas del juego durante `playing`.
//   9. `dt` en segundos con cap a 0.05 s (el original acumulaba ms sin cap).

import type { EngineCallbacks } from "@/src/games/registry";

export const W = 800;
export const H = 600;

// ── Constantes del original (copiadas literalmente) ─────────────────────────────
const COLS = 10;
const ROWS = 20;
const BLOCK = 30; // celda del tablero lógico (300×600)

// Tablero centrado en el canvas 800×600 a escala 1:1, sin tocar las constantes.
const BOARD_X = (W - COLS * BLOCK) / 2; // 250
const BOARD_Y = 0;

const LINE_SCORES = [0, 100, 300, 500, 800];
const WALL_KICKS = [0, -1, 1, -2, 2];
const GHOST_ALPHA = 0.2;
const DROP_INITIAL = 1000; // ms de caída inicial
const DROP_MIN = 100; // ms de caída mínima
const SOFT_DROP_POINTS = 1;
const HARD_DROP_POINTS = 2;

// ── Paleta neón por pieza ────────────────────────────────────────────────────────
// La identidad de color por pieza es mecánica, no decorativa: se mapea la
// paleta pastel del original a la neón de Arcade Vault conservando el color.
const COLORS: readonly (string | null)[] = [
  null,
  "#00ffff", // I - cyan (antes '#4dd0e1')
  "#f5ff00", // O - amarillo (antes '#ffd54f')
  "#ff00ff", // T - magenta (antes '#ba68c8')
  "#39ff14", // S - verde neón (antes '#81c784')
  "#ff3131", // Z - rojo neón (antes '#e57373')
  "#2979ff", // J - azul neón (antes '#90caf9')
  "#ff9100", // L - naranja neón (antes '#ffb74d')
  "#c0c0c0", // N - gris metálico (antes '#9e9e9e')
];

const GRID_COLOR = "rgba(0, 255, 255, 0.18)"; // el original leía --grid-line del CSS
const NEXT_FRAME_COLOR = "rgba(0, 255, 255, 0.35)";
const NEXT_BLOCK = 30; // celda del preview (igual que el next-canvas del original)
const NEXT_SIZE = 4; // área 4×4 del preview del original
const NEXT_PANEL = { x: 595, y: 70, size: 160 }; // panel "siguiente" en el lateral

// ── Piezas ───────────────────────────────────────────────────────────────────────
// Las 8 del original: el código randomiza tipos 1–8, incluida la "N" tuerca
// (su README dice 7 piezas estándar, pero la octava existe en game.js).
const PIECES: readonly (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

type Board = number[][];

// ── Utilidades (portadas de las funciones del original) ──────────────────────────
function createBoard(): Board {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function collide(
  board: Board,
  shape: number[][],
  ox: number,
  oy: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 8) + 1;
  const template = PIECES[type];
  if (!template) throw new Error(`Pieza ${type} no definida`); // inalcanzable: tipo ∈ 1..8
  const shape = template.map((row) => [...row]);
  return new Piece(
    type,
    shape,
    Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    0,
  );
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  alpha?: number,
): void {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  if (!color) return; // índice 0 (null); inalcanzable para celdas pintadas
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  // highlight (como el original)
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x + 1, y + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}

// ── Pieza ────────────────────────────────────────────────────────────────────────
class Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;

  constructor(type: number, shape: number[][], x: number, y: number) {
    this.type = type;
    this.shape = shape;
    this.x = x;
    this.y = y;
  }
}

// ── Motor ────────────────────────────────────────────────────────────────────────
export type GameState = "playing" | "gameover";

// Teclas del juego: reciben preventDefault durante la partida
// (no hacen scroll ni re-activan botones enfocados del HUD).
const GAME_KEYS: readonly string[] = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "KeyX",
  "Space",
];

export class TetrisEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly callbacks: EngineCallbacks & {
    onLines?(lines: number): void;
  };

  // Input
  private readonly keys: Record<string, boolean> = {};
  private readonly justPressed: Record<string, boolean> = {};

  // Estado del juego (el mismo del original)
  private board: Board = createBoard();
  private current: Piece = randomPiece();
  private next: Piece = randomPiece();
  private score = 0;
  private lines = 0;
  private level = 1;
  private dropAccum = 0;
  private dropInterval = DROP_INITIAL;
  private state: GameState = "playing";

  // Loop
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private paused = false;
  private destroyed = false;

  constructor(
    ctx: CanvasRenderingContext2D,
    callbacks: EngineCallbacks & { onLines?(lines: number): void },
  ) {
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
    // Cambio 8: las teclas del juego no hacen scroll ni re-activan botones del
    // HUD mientras la partida está en curso (aunque esté en pausa).
    if (GAME_KEYS.includes(e.code) && this.state === "playing") {
      e.preventDefault();
    }
    // Como en el original (`if (paused || gameOver) return`): la entrada se
    // ignora fuera de la partida activa.
    if (this.paused || this.state !== "playing") return;
    // Sin el guard `!keys[e.code]` del template de asteroides a propósito:
    // el original movía la pieza en CADA keydown, incluidos los repeats del
    // teclado (mantener ← desliza la pieza, como allí).
    this.justPressed[e.code] = true;
    this.keys[e.code] = true;
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
  };

  /** Edge-trigger: true una sola vez por pulsación (repeats incluidos). */
  private pressed(code: string): boolean {
    const val = this.justPressed[code];
    this.justPressed[code] = false;
    return val;
  }

  // ── Estado del juego ──
  private initGame(): void {
    this.board = createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = DROP_INITIAL;
    this.dropAccum = 0;
    this.state = "playing";
    this.next = randomPiece();
    this.spawn();
  }

  private spawn(): void {
    this.current = this.next;
    this.next = randomPiece();
    if (
      collide(this.board, this.current.shape, this.current.x, this.current.y)
    ) {
      this.endGame();
    }
  }

  private endGame(): void {
    // Cambio 4: el original además cancelaba el RAF aquí; en la plataforma el
    // componente se desmonta al abrirse el GameOverModal y `destroy()` lo hace.
    this.state = "gameover";
    this.callbacks.onGameOver(this.score);
  }

  private merge(): void {
    const { shape, x, y } = this.current;
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) this.board[y + r][x + c] = shape[r][c];
  }

  private clearLines(): void {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((v) => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      this.lines += cleared;
      this.callbacks.onLines?.(this.lines); // solo al eliminar líneas
      this.score += (LINE_SCORES[cleared] || 0) * this.level;
      this.callbacks.onScore(this.score); // solo al sumar
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.callbacks.onLevel(this.level); // solo al cambiar de nivel
      }
      this.dropInterval = Math.max(
        DROP_MIN,
        DROP_INITIAL - (this.level - 1) * 90,
      );
    }
  }

  private ghostY(): number {
    let gy = this.current.y;
    while (!collide(this.board, this.current.shape, this.current.x, gy + 1))
      gy++;
    return gy;
  }

  private tryRotate(): void {
    const rotated = rotateCW(this.current.shape);
    for (const kick of WALL_KICKS) {
      if (
        !collide(this.board, rotated, this.current.x + kick, this.current.y)
      ) {
        this.current.shape = rotated;
        this.current.x += kick;
        return;
      }
    }
  }

  private hardDrop(): void {
    const gy = this.ghostY();
    this.score += (gy - this.current.y) * HARD_DROP_POINTS;
    this.callbacks.onScore(this.score);
    this.current.y = gy;
    this.lockPiece();
  }

  private softDrop(): void {
    if (
      !collide(
        this.board,
        this.current.shape,
        this.current.x,
        this.current.y + 1,
      )
    ) {
      this.current.y++;
      this.score += SOFT_DROP_POINTS;
      this.callbacks.onScore(this.score);
    } else {
      this.lockPiece();
    }
  }

  private lockPiece(): void {
    this.merge();
    this.clearLines();
    this.spawn();
  }

  // ── Update ──
  private update(dt: number): void {
    // En gameover no se reinicia con tecla: lo controla el GameOverModal.
    if (this.state === "gameover") return;

    // Entrada por pulsación (el original la procesaba en el evento keydown;
    // con `pressed()` se procesa una vez por pulsación en el frame siguiente).
    if (this.pressed("ArrowLeft")) {
      if (
        !collide(
          this.board,
          this.current.shape,
          this.current.x - 1,
          this.current.y,
        )
      )
        this.current.x--;
    }
    if (this.pressed("ArrowRight")) {
      if (
        !collide(
          this.board,
          this.current.shape,
          this.current.x + 1,
          this.current.y,
        )
      )
        this.current.x++;
    }
    if (this.pressed("ArrowDown")) this.softDrop();
    if (this.pressed("ArrowUp") || this.pressed("KeyX")) this.tryRotate();
    if (this.pressed("Space")) this.hardDrop();

    // Caída automática: acumulación en ms como el original, dt en segundos con cap.
    this.dropAccum += dt * 1000;
    if (this.dropAccum >= this.dropInterval) {
      this.dropAccum = 0;
      if (
        !collide(
          this.board,
          this.current.shape,
          this.current.x,
          this.current.y + 1,
        )
      ) {
        this.current.y++;
      } else {
        this.lockPiece();
      }
    }
  }

  // ── Draw ──
  private draw(): void {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, W, H);

    this.drawGrid();

    // Board
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        drawBlock(
          this.ctx,
          BOARD_X + c * BLOCK,
          BOARD_Y + r * BLOCK,
          this.board[r][c],
          BLOCK,
        );

    // Ghost
    const gy = this.ghostY();
    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        if (this.current.shape[r][c])
          drawBlock(
            this.ctx,
            BOARD_X + (this.current.x + c) * BLOCK,
            BOARD_Y + (gy + r) * BLOCK,
            this.current.shape[r][c],
            BLOCK,
            GHOST_ALPHA,
          );

    // Pieza actual
    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        if (this.current.shape[r][c])
          drawBlock(
            this.ctx,
            BOARD_X + (this.current.x + c) * BLOCK,
            BOARD_Y + (this.current.y + r) * BLOCK,
            this.current.shape[r][c],
            BLOCK,
          );

    this.drawNext();
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = GRID_COLOR;
    this.ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(BOARD_X + c * BLOCK, BOARD_Y);
      this.ctx.lineTo(BOARD_X + c * BLOCK, BOARD_Y + ROWS * BLOCK);
      this.ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(BOARD_X, BOARD_Y + r * BLOCK);
      this.ctx.lineTo(BOARD_X + COLS * BLOCK, BOARD_Y + r * BLOCK);
      this.ctx.stroke();
    }
  }

  private drawNext(): void {
    const { x, y, size } = NEXT_PANEL;
    // Marco del panel
    this.ctx.strokeStyle = NEXT_FRAME_COLOR;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, size, size);

    // Pieza centrada en el área 4×4, con el centrado por celdas del original.
    const shape = this.next.shape;
    const pad = (size - NEXT_SIZE * NEXT_BLOCK) / 2;
    const offX = Math.floor((NEXT_SIZE - shape[0].length) / 2);
    const offY = Math.floor((NEXT_SIZE - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        drawBlock(
          this.ctx,
          x + pad + (offX + c) * NEXT_BLOCK,
          y + pad + (offY + r) * NEXT_BLOCK,
          shape[r][c],
          NEXT_BLOCK,
        );
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
