// ── Motor de Asteroids (ROCAS) ─────────────────────────────────────────────────
// Port fiel de references/started-games/02-asteroids/game.js a TypeScript puro
// (strict mode, sin `any`). Sin dependencias de React ni del DOM: recibe el
// contexto del canvas por parámetro y expone callbacks para que el HUD de React
// sea la única fuente de verdad. (SPEC 05 — Data model)
//
// Únicos 4 cambios respecto al original:
//   1. Sin reinicio con Espacio en `gameover` — el reinicio lo controla el GameOverModal.
//   2. Sin HUD interno del canvas (`drawHUD`, `drawLifeIcon`, `drawOverlay`): solo se dibuja la acción.
//   3. Paleta neón de Arcade Vault: nave cyan, asteroides amarillos, balas magenta.
//   4. `preventDefault()` en las teclas del juego durante `playing`/`dead`.

export const W = 800;
export const H = 600;

// ── Utils ───────────────────────────────────────────────────────────────────────
const wrap = (v: number, max: number): number => ((v % max) + max) % max;
const dist = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): number => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min: number, max: number): number =>
  min + Math.random() * (max - min);
const randInt = (min: number, max: number): number =>
  Math.floor(rand(min, max + 1));

// ── Constants ───────────────────────────────────────────────────────────────────
export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_DURATION = 5;
export const POWERUP_TTL = 12;
export const TRIPLE_SPREAD = 0.18;

// ── Bullet ──────────────────────────────────────────────────────────────────────
export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  radius: number;
  dead: boolean;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#ff00ff"; // magenta (paleta neón, antes '#fff')
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ────────────────────────────────────────────────────────────────────
export const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
export const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
export const POINTS = [0, 100, 50, 20]; // puntos por tamaño

export class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  dead: boolean;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: number[][];

  constructor(x: number, y: number, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split(): Asteroid[] {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = "#f5ff00"; // amarillo (paleta neón, antes '#fff')
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── PowerUp ─────────────────────────────────────────────────────────────────────
export class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl = POWERUP_TTL;
    this.dead = false;
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, now: number): void {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(now / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    const r = this.radius * pulse;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = "#00ffff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y);
  }
}

// ── Ship ────────────────────────────────────────────────────────────────────────
export class Ship {
  x = 0;
  y = 0;
  angle = 0;
  vx = 0;
  vy = 0;
  radius = 12;
  thrusting = false;
  invincible = 0;
  shootCooldown = 0;
  tripleShot = 0;
  dead = false;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.tripleShot = 0;
    this.dead = false;
  }

  update(dt: number, keys: Record<string, boolean>): void {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;

    const ROT = 3.5; // rad/s
    const THRUST = 260; // px/s²
    const DRAG = 0.987;

    if (keys["ArrowLeft"]) this.angle -= ROT * dt;
    if (keys["ArrowRight"]) this.angle += ROT * dt;

    this.thrusting = !!keys["ArrowUp"];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = "#00ffff"; // cyan (paleta neón, antes '#fff')
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = "rgba(255, 130, 0, 0.85)";
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ──────────────────────────────────────────────────────
export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Motor ───────────────────────────────────────────────────────────────────────
export type GameState = "playing" | "dead" | "gameover";

export interface EngineCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onTripleShot(secondsLeft: number | null): void; // null cuando el powerup expira
  onGameOver(score: number): void;
}

const GAME_KEYS: readonly string[] = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Space",
];

export class AsteroidsEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly callbacks: EngineCallbacks;

  // Input
  private readonly keys: Record<string, boolean> = {};
  private readonly justPressed: Record<string, boolean> = {};

  // Estado del juego (el mismo del original)
  private ship = new Ship();
  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private particles: Particle[] = [];
  private powerUps: PowerUp[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private state: GameState = "playing";
  private deadTimer = 0;
  private powerUpSpawned = false;
  private killsSinceSpawn = 0;

  // Loop
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private paused = false;
  private destroyed = false;
  private now = 0;

  // Último valor del temporizador 3x notificado (callback solo al cambiar)
  private lastTripleSeconds: number | null = null;

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
    // Cambio 4: las teclas del juego no hacen scroll ni re-activan botones del HUD.
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

  private pressed(code: string): boolean {
    const val = this.justPressed[code];
    this.justPressed[code] = false;
    return val;
  }

  // ── Estado del juego ──
  private spawnAsteroids(count: number): void {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      this.asteroids.push(new Asteroid(x, y, 3));
    }
  }

  private initGame(): void {
    this.ship = new Ship();
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.state = "playing";
    this.spawnAsteroids(4);
  }

  private nextLevel(): void {
    this.level++;
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.ship.reset();
    this.spawnAsteroids(3 + this.level);
    this.callbacks.onLevel(this.level);
  }

  private explode(x: number, y: number, count = 8): void {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y));
  }

  private killShip(): void {
    this.explode(this.ship.x, this.ship.y, 14);
    this.ship.dead = true;
    this.lives--;
    this.callbacks.onLives(this.lives);
    if (this.lives <= 0) {
      this.state = "gameover";
      this.callbacks.onGameOver(this.score);
    } else {
      this.state = "dead";
      this.deadTimer = 2;
    }
  }

  // ── Update ──
  private update(dt: number): void {
    // Cambio 1: en gameover ya no se reinicia con Espacio — lo controla el modal.
    if (this.state === "gameover") {
      this.particles.forEach((p) => p.update(dt));
      this.particles = this.particles.filter((p) => !p.dead);
      return;
    }

    if (this.state === "dead") {
      this.deadTimer -= dt;
      this.particles.forEach((p) => p.update(dt));
      this.particles = this.particles.filter((p) => !p.dead);
      this.asteroids.forEach((a) => a.update(dt));
      if (this.deadTimer <= 0) {
        this.state = "playing";
        this.ship.reset();
      }
      return;
    }

    // Disparar
    if (this.pressed("Space")) {
      this.bullets.push(...this.ship.tryShoot());
    }

    this.ship.update(dt, this.keys);
    this.bullets.forEach((b) => b.update(dt));
    this.asteroids.forEach((a) => a.update(dt));
    this.particles.forEach((p) => p.update(dt));
    this.powerUps.forEach((p) => p.update(dt));

    this.bullets = this.bullets.filter((b) => !b.dead);
    this.particles = this.particles.filter((p) => !p.dead);
    this.powerUps = this.powerUps.filter((p) => !p.dead);

    for (const p of this.powerUps) {
      if (!p.dead && dist(this.ship, p) < this.ship.radius + p.radius) {
        p.dead = true;
        this.ship.tripleShot = POWERUP_DURATION;
      }
    }

    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of this.bullets) {
      for (const a of this.asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          this.score += POINTS[a.size];
          this.callbacks.onScore(this.score); // solo al sumar
          this.explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!this.powerUpSpawned) {
            this.killsSinceSpawn++;
            const guaranteed = this.killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              this.powerUps.push(new PowerUp(a.x, a.y));
              this.powerUpSpawned = true;
            }
          }
        }
      }
    }
    this.asteroids = this.asteroids.filter((a) => !a.dead).concat(newAsteroids);
    this.bullets = this.bullets.filter((b) => !b.dead);

    // Nave vs asteroide
    if (this.ship.invincible <= 0) {
      for (const a of this.asteroids) {
        if (dist(this.ship, a) < this.ship.radius + a.radius * 0.82) {
          this.killShip();
          break;
        }
      }
    }

    // Nivel completado
    if (this.asteroids.length === 0) this.nextLevel();

    // Temporizador 3x → callback solo cuando cambia su valor con 1 decimal
    if (this.ship.tripleShot > 0) {
      const seconds = Math.round(this.ship.tripleShot * 10) / 10;
      if (seconds !== this.lastTripleSeconds) {
        this.lastTripleSeconds = seconds;
        this.callbacks.onTripleShot(seconds);
      }
    } else if (this.lastTripleSeconds !== null) {
      this.lastTripleSeconds = null;
      this.callbacks.onTripleShot(null);
    }
  }

  // ── Draw ──
  private draw(): void {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, W, H);

    this.particles.forEach((p) => p.draw(this.ctx));
    this.asteroids.forEach((a) => a.draw(this.ctx));
    this.powerUps.forEach((p) => p.draw(this.ctx, this.now));
    this.bullets.forEach((b) => b.draw(this.ctx));
    this.ship.draw(this.ctx);
  }

  // ── Loop principal ──
  private loop = (ts: number): void => {
    if (this.destroyed) return;
    const dt =
      this.lastTime === null ? 0 : Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    this.now = ts;
    if (!this.paused) {
      this.update(dt);
      this.draw();
    }
    this.rafId = requestAnimationFrame(this.loop);
  };
}
