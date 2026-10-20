# SPEC 07 — Juego Tetris (CAÍDA)

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 06
> **Date:** 2026-10-20
> **Objective:** Integrar CAÍDA (Tetris) en la plataforma como segundo juego real en `/jugar/caida`: motor portado de `references/started-games/03-tetris/game.js` a TypeScript puro (`src/games/caida/engine.ts`), wrapper `TetrisGame.tsx`, estreno del registry de motores (`src/games/registry.ts`) con refactor de `GamePlayer`, entrada de catálogo reutilizada (placeholder `caida` con portada `cover-tetro`) y leaderboard en la nube (fila `caida` en `public.games`).

---

## Scope

**In:**

- Motor TypeScript puro `src/games/caida/engine.ts` (port de `references/started-games/03-tetris/game.js`): tablero 10×20, 8 piezas (I, O, T, S, Z, J, L y N "tuerca"), rotación con wall kicks `[0, ±1, ±2]`, pieza fantasma (alpha 0.2), soft/hard drop, `LINE_SCORES = [0, 100, 300, 500, 800] × nivel`, nivel = `floor(lines/10) + 1`, velocidad `max(100, 1000 − (level−1) × 90)` ms
- Nueva clase `TetrisEngine` con el loop (`requestAnimationFrame`, `dt` en segundos con cap a 0.05 s), input de teclado, callbacks de HUD (`onScore`, `onLevel`, `onLines`, `onGameOver`) y control (`pause`, `resume`, `destroy`)
- Nuevo componente `src/components/TetrisGame.tsx` (Client Component): canvas 800×600 `.game-canvas`, instancia del motor en `useEffect` con cleanup, `paused` como prop
- **Caso A — primera vez:** nuevo `src/games/registry.ts` (contrato `EngineCallbacks`/`GameEngineProps`, config de HUD y `GAME_ENGINES` con `rocas` + `caida`) + refactor de `src/components/GamePlayer.tsx` para despachar por registry; `AsteroidsGame.tsx` y `asteroids/engine.ts` pasan a importar el contrato del registry (cero cambio de comportamiento)
- Entrada `caida` de `src/data/games.ts` reutilizada tal cual (título CAÍDA, PUZZLE, magenta, `cover-tetro`, 31.8K) con una única corrección ortográfica en `long` ("encástralas" → "encájalas")
- Portada `cover-tetro` ya existente en `globals.css` (creada para el placeholder en SPEC 02): se verifica en `/biblioteca`; no se rediseña salvo que se vea mal
- Leaderboard: verificar que la fila `caida` existe en `public.games` (SPEC 06 ya la sembró); solo si faltara, crear y aplicar la migración `add_game_caida`

**Out of scope (for future specs):**

- Efectos de sonido (WebAudio) — heredado de SPEC 05
- Controles táctiles / botones en pantalla para móvil
- Pausa con tecla (`P`/`Esc`) — la pausa se controla solo con el botón del HUD (la tecla `P` del original se elimina)
- Mouse — el tetris no lo usa (arkanoid sí; se decidirá en su spec)
- Theme toggle claro/oscuro del original — tema neón fijo de la plataforma
- Migrar los demás juegos simulados a motores reales
- Tests automatizados

---

## Data model

### Motor — `src/games/caida/engine.ts`

TypeScript puro estricto, sin `any`, sin imports de React ni del DOM (el `ctx` llega por parámetro). Sigue la convención `src/games/<id>/` estrenada por SPEC 05.

```ts
// Contrato idéntico al de SPEC 05 + onLines (opcional, solo juegos con líneas).
// El motor importa el tipo con `import type` desde el registry (Fase 5) para no crear ciclos.
export class TetrisEngine {
  constructor(
    ctx: CanvasRenderingContext2D,
    callbacks: EngineCallbacks & { onLines?(lines: number): void },
  );
  pause(): void; // congela el loop (no update ni draw)
  resume(): void;
  destroy(): void; // cancelAnimationFrame + removeEventListener, con guard `destroyed`
}
```

- **Estado interno** el del original adaptado a clases: `state: 'playing' | 'gameover'`, `board` (matriz `ROWS×COLS`, `0` = vacío, `1–8` = índice de pieza), `current`/`next` (`{ type, shape, x, y }`), `score`, `lines`, `level`, `dropAccum`, `dropInterval`, `animId`, `destroyed`.
- **Constantes del original copiadas literalmente**: `COLS = 10`, `ROWS = 20`, `BLOCK = 30` (tablero lógico 300×600), `LINE_SCORES = [0, 100, 300, 500, 800]`, drop inicial 1000 ms, hard drop +2 por celda, soft drop +1 por fila, wall kicks `[0, -1, 1, -2, 2]`, ghost alpha 0.2, nivel `floor(lines/10) + 1`.
- **8 piezas** (el original randomiza `Math.floor(Math.random() * 8) + 1` → tipos 1–8): I, O, T, S, Z, J, L y **N (tuerca)**. El README de la referencia dice "7 piezas estándar" pero el código incluye la octava; el port es fiel y conserva las 8.
- **Callbacks solo cuando cambia el valor**: `onScore` al sumar (soft drop, hard drop, clearLines), `onLevel` al cambiar nivel, `onLines` al eliminar líneas, `onGameOver(score)` al terminar. Nunca por frame.
- **Dibujo en canvas 800×600**: el tablero lógico 300×600 se dibuja centrado en el canvas (escala 1:1, sin tocar constantes) con grilla neón tenue; la pieza siguiente se dibuja como parte de la acción en el lateral derecho del canvas, con su marco y sin HUD (el HUD de React no pinta nada de esto).
- **Paleta neonizada conservando el color por pieza** (la identidad de color es mecánica, no decorativa): I `#00ffff`, O `#f5ff00`, T `#ff00ff`, S verde neón, Z rojo neón, J azul neón, L naranja neón, N gris metálico. El color de grilla del original (`--grid-line` por `getComputedStyle`) pasa a constante neón tenue.
- **Cambios respecto al original (los únicos nueve):**
  1. **Sin tecla `P` de pausa** — la pausa la controla el botón del HUD vía `pause()`/`resume()`.
  2. **Sin HUD interno del canvas** (`updateHUD` sobre el DOM, panel lateral) — el HUD es de React vía callbacks.
  3. **Sin overlay interno de PAUSA/GAME OVER** — el `GameOverModal` y el overlay de pausa de React los pintan.
  4. **Sin botón de reinicio ni restart con tecla en gameover** — el reinicio lo controla el `GameOverModal` (remount por `key`).
  5. **Sin theme toggle claro/oscuro** — tema neón fijo.
  6. **Canvas único 800×600** — los dos canvas del original (tablero + next) se funden en el canvas de la plataforma (tablero centrado + pieza siguiente en el lateral).
  7. **Paleta pastel → neón** por pieza (tabla de arriba).
  8. **`preventDefault()`** en las teclas del juego (`ArrowLeft`, `ArrowRight`, `ArrowDown`, `ArrowUp`, `KeyX`, `Space`) mientras el estado es `playing`, para que Espacio no re-dispare un botón enfocado del HUD y las flechas no hagan scroll.
  9. **`dt` en segundos con cap a 0.05 s** (convención de la plataforma; el original acumulaba ms sin cap contra `dropInterval` en ms, que se conserva).

### Componente — `src/components/TetrisGame.tsx`

- Client Component con `"use client"`. Props: `GameEngineProps` de `@/src/games/registry` (`import type` — nunca import de valor para evitar ciclos).
- `<canvas width={800} height={600} className="game-canvas" />` con `useRef`.
- `useEffect` de montaje (deps `[]` + comentario eslint-disable, mismo patrón que `AsteroidsGame`): instancia `TetrisEngine`, arranca el loop; cleanup `destroy()`. Idempotente (StrictMode monta dos veces en dev).
- `useEffect` sobre `paused`: `pause()` / `resume()`.
- Los callbacks de props van al motor sin procesar. Desestructura `onScore`, `onLevel`, `onLines`, `onGameOver`; ignora `onLives`/`onTripleShot` (los juegos que no usan un callback no lo desestructuran).

### Registry — `src/games/registry.ts` (Caso A, primera vez)

Contrato común motor ↔ React (vive aquí y no en un engine concreto porque es el contrato de la PLATAFORMA):

```ts
export interface EngineCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onTripleShot(secondsLeft: number | null): void; // null cuando el powerup expira
  onGameOver(score: number): void;
}

export interface GameEngineProps extends EngineCallbacks {
  paused: boolean;
  onLines?(lines: number): void; // solo juegos con líneas (caida)
}

export type HudStatKey = "score" | "lives" | "level" | "lines" | "triple";

export interface HudStat {
  key: HudStatKey;
  label: string;
  initial: number;
  conditional?: boolean; // solo se renderiza cuando el valor no es null (temporizador 3x)
}

export interface GameEngineEntry {
  component: ComponentType<GameEngineProps>;
  hud: HudStat[];
}

export const GAME_ENGINES: Record<string, GameEngineEntry> = {
  rocas: { component: AsteroidsGame, hud: [score, lives, level, triple] },
  caida: { component: TetrisGame, hud: [score, lines, level] },
};

export function getGameEngine(id: string): GameEngineEntry | undefined;
```

- `src/games/asteroids/engine.ts`: eliminar la interfaz local `EngineCallbacks` y añadir `import type { EngineCallbacks } from "@/src/games/registry";`. Cero cambio de comportamiento.
- `src/components/AsteroidsGame.tsx`: sustituir su interfaz local por `GameEngineProps` del registry.

### Refactor de `GamePlayer.tsx` (Caso A)

1. Sustituir `import AsteroidsGame` y `const isRocas = game?.id === "rocas"` por `const entry = game ? getGameEngine(game.id) : undefined; const EngineComponent = entry?.component; const hud = entry?.hud ?? SIM_HUD;` donde `SIM_HUD` replica el HUD simulado actual (score, lives, level).
2. Añadir estado `lines` y mapa tipado de setters `statSetters: Record<HudStatKey, (v: number | null) => void>` (`score`, `lives`, `level`, `lines`, `triple`).
3. El HUD pasa a ser un loop sobre `hud`: label de la config; render por switch en GamePlayer (`score` → `toLocaleString("es-ES")`, `lives` → `"♥ ".repeat(v).trim() || "—"`, `level` → `padStart(2, "0")`, `lines` → `String(v)`, `triple` → `3x ${v.toFixed(1)}s`). Omitir stats con `conditional && valor === null`. "Jugador" sigue primero, incondicional.
4. `restart()` genérico: `for (const s of hud) statSetters[s.key](s.initial);` + `setTriple(null)`, `setPaused(false)`, `setOver(false)`, `setRestartKey(k => k + 1)`.
5. La simulación (intervalo de score + level-up) pasa a gatearse por `!entry` en lugar de `!isRocas`; la arena: `entry ? (!over && <EngineComponent key={restartKey} paused={paused} onScore={setScore} onLives={setLives} onLevel={setLevel} onTripleShot={setTriple} onGameOver={handleGameOver} onLines={setLines} />) : (placeholder divs)` — desmontaje en `over` y remount por `key` intactos.
6. Overlay de pausa, CRT, botón FIN, "JUEGO NO ENCONTRADO" y el bloque de `GameOverModal` no cambian.

### Catálogo — `src/data/games.ts` y `globals.css`

- Entrada `caida` reutilizada: `id`, `title` ("CAÍDA"), `short`, `long`, `cat` ("PUZZLE"), `cover` ("cover-tetro"), `color` ("magenta") y `plays` ("31.8K") no cambian. Única corrección en `long`: "encástralas" → "encájalas". (El texto "La velocidad aumenta sin piedad cada 10 líneas" ya describe el juego real.)
- Portada: `.cover-tetro` ya existe en `globals.css` desde SPEC 02. Se verifica que la tarjeta se ve bien en `/biblioteca` y `/juego/caida`; solo si se ve mal se rediseña invocando /frontend-design.

### Leaderboard — Supabase

- SPEC 06 sembró `public.games` con las 8 filas, incluida `('caida', 'CAÍDA')`. Fase 7: verificar con `execute_sql` que la fila existe (FK de `scores` satisfecho). Solo si faltara, crear `supabase/migrations/<YYYYMMDDHHMMSS>_add_game_caida.sql` (`insert ... on conflict (id) do nothing`) y aplicarla con la herramienta MCP `apply_migration`.
- **No se toca** `GameOverModal`, `GameDetail`, `HallOfFame`, `Library`, `Leaderboard` ni las políticas RLS: el leaderboard es 100% genérico (SPEC 06).

---

## Implementation plan

1. Crear el motor `src/games/caida/engine.ts` (port del `game.js` con los 9 cambios listados). Compila; aún no se usa.
2. Crear el wrapper `src/components/TetrisGame.tsx`. Compila; aún no conectado.
3. Registry + refactor: crear `src/games/registry.ts`, migrar `asteroids/engine.ts` y `AsteroidsGame.tsx` al contrato compartido, refactorizar `GamePlayer.tsx` (Caso A) y registrar `caida` en `GAME_ENGINES`. Verificación de regresión: `/jugar/rocas` igual que antes y `/jugar/bloque-buster` (simulado) intacto.
4. Catálogo y portada: corrección de `long` en `src/data/games.ts`; verificar `.cover-tetro` en `/biblioteca` (rediseño con /frontend-design solo si se ve mal).
5. Leaderboard: verificar por SQL la fila `caida` en `public.games`; migración solo si faltara.
6. Verificar: `npm run build`, `npm run lint`, playtest completo en `/jugar/caida` y leaderboard end-to-end.

---

## Acceptance criteria

- [ ] `/jugar/caida` renderiza el juego real en canvas dentro del CRT, sin errores en la consola.
- [ ] El tablero 10×20 se dibuja centrado en el canvas 800×600 con la grilla neón y la pieza siguiente en el lateral derecho.
- [ ] `←`/`→` mueven la pieza, `↓` hace soft drop (+1 por fila), `↑` o `X` rotan con wall kicks, `Espacio` hace hard drop (+2 por celda); el HUD de React refleja la puntuación real al instante.
- [ ] Las teclas del juego no hacen scroll de página ni re-activan botones enfocados del HUD.
- [ ] Eliminar 1/2/3/4 líneas suma `100/300/500/800 × nivel` respectivamente; las líneas desaparecen del tablero y el HUD muestra el contador real.
- [ ] El nivel sube cada 10 líneas y la caída se acelera según `max(100, 1000 − (nivel − 1) × 90)` ms; el HUD muestra el nivel real.
- [ ] La pieza fantasma se dibuja con alpha 0.2 en la posición de aterrizaje y la pieza siguiente coincide con la que aparece después.
- [ ] Cuando la pieza nueva no cabe al aparecer, el `GameOverModal` aparece con la puntuación final real, sin reinicio con tecla.
- [ ] El botón PAUSA congela el juego y muestra el overlay "EN PAUSA"; REANUDAR continúa exactamente donde estaba.
- [ ] El botón FIN abre el `GameOverModal` con la puntuación real del momento.
- [ ] "GUARDAR PUNTUACIÓN" inserta la fila en `scores` con `game_id = 'caida'` (verificable con SQL) y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] "JUGAR DE NUEVO" inicia una partida limpia (puntuación 0, líneas 0, nivel 1, tablero vacío); "VOLVER AL VAULT" navega sin que el loop siga corriendo.
- [ ] `/juego/caida` muestra la marca guardada en el leaderboard y el "Mejor global" real; `/salon` la muestra en la pestaña CAÍDA; la tarjeta de `/` y `/biblioteca` muestra "MEJOR PUNTUACIÓN" con el valor.
- [ ] `/jugar/rocas` se ve y juega igual que antes del refactor del registry; `/jugar/bloque-buster` y el resto de simulados se ven y funcionan igual que antes.
- [ ] `npm run build` completa sin errores.
- [ ] `npm run lint` no introduce errores nuevos en los archivos de este spec.

---

## Decisions

- **Sí:** ID `caida` reutilizando el placeholder del catálogo. Título CAÍDA, categoría PUZZLE, portada `cover-tetro`, color magenta y plays 31.8K ya existen en `GAMES` y en `public.games`; es el placeholder evidente de este juego.
- **No:** ID `tetris` con entrada nueva de catálogo. Duplicaría el juego en la biblioteca o exigiría eliminar el placeholder sin beneficio.
- **Sí:** Port fiel de `game.js`, incluidas las **8 piezas** (el original randomiza tipos 1–8; la "N" tuerca existe en el código aunque su README diga 7), wall kicks, ghost, soft/hard drop y las constantes de puntuación/velocidad copiadas literalmente.
- **No:** "Corregir" el original (quitar la pieza N, rebalancear puntuaciones, añadir victoria a N líneas). El port es fiel; la victoria no existe en tetris.
- **Sí:** Paleta pastel → neón conservando el color por pieza (I cyan, O amarillo, T magenta…). La identidad de color por pieza es mecánica, no decorativa.
- **No:** Paleta neón unificada. Perdería la lectura visual de qué pieza es cada una.
- **Sí:** Tablero lógico 300×600 dibujado centrado dentro del canvas 800×600, con la pieza siguiente como parte de la acción en el lateral. La lógica y las constantes del original quedan intactas.
- **No:** Rediseñar la grilla para llenar el ancho del canvas. Cambiaría `COLS`/`ROWS`/`BLOCK` y desvirtuaría el port.
- **Sí:** HUD de React como única fuente de verdad (Puntuación, Líneas, Nivel) sincronizado por callbacks, con `onLines` añadido como prop opcional del `GameEngineProps`. El canvas solo dibuja la acción.
- **No:** HUD interno del canvas ni overlays internos de pausa/game over. Duplicaría estado y rompería la consistencia con rocas.
- **Sí:** Registry de motores (Caso A) con refactor de `GamePlayer` a despacho genérico. Con un segundo motor real se justifica lo que SPEC 05 difirió explícitamente ("el registry se justifica cuando exista un segundo motor").
- **No:** Otro condicional por `id` en `GamePlayer`. Sería el patrón que SPEC 05 descartó al crecer a dos motores.
- **Sí:** Sin sonido, sin pausa con tecla, sin mouse y sin theme toggle. SPEC 05 los difirió o el port no debe introducirlos.
- **Sí:** Verificar por SQL que `public.games` ya contiene `caida` (sembrada por SPEC 06) y crear la migración `add_game_caida` solo si faltara. Evita una migración redundante que repetiría un seed ya aplicado.
- **Sí:** Corregir "encástralas" → "encájalas" en el `long` de `caida` (errata heredada del placeholder). Es la única corrección de texto; el resto de la entrada no se toca.

---

## Risks

| Risk                                                                                                                   | Mitigation                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La pieza N (tuerca) sorprende a quien espera el tetris clásico de 7 piezas                                             | Documentado explícitamente en el Data model: el código original randomiza 1–8 y el port es fiel; la spec lo fija como decisión aprobada                        |
| Los callbacks se disparan por frame y React re-renderiza en exceso                                                     | Callbacks solo cuando cambia el valor mostrado (al sumar puntos, al cambiar líneas/nivel); nunca en el loop                                                    |
| `Espacio` re-activa el último botón enfocado del HUD (p. ej. PAUSA) mientras se juega                                  | `preventDefault()` en las teclas del juego mientras el estado es `playing`; al abrirse el modal, el desmontaje elimina los listeners                           |
| El loop o los listeners siguen vivos al navegar fuera de `/jugar/caida`                                                | `destroy()` en el cleanup del `useEffect` (cancela RAF y removeEventListener, con guard `destroyed`); desmontaje en game over y remount por `key`              |
| React StrictMode en dev monta/desmonta dos veces el efecto                                                             | El efecto de montaje es idempotente (crea motor y arranca; el cleanup destruye todo)                                                                           |
| El refactor del registry (Caso A) rompe `rocas` o los juegos simulados                                                 | Verificación obligatoria de regresión en el paso 3: `/jugar/rocas` juega igual que antes y `/jugar/bloque-buster` conserva la simulación intacta               |
| El INSERT de `scores` falla por FK si falta la fila `caida` en `public.games` (síntoma engañoso: "NO SE PUDO GUARDAR") | Se verifica la fila por SQL en el paso 5, antes del playtest de guardado del paso 6 (SPEC 06 ya la sembró; migración solo si faltara)                          |
| El tablero 300×600 centrado en un canvas 800×600 se percibe pequeño                                                    | El conjunto (tablero + pieza siguiente en el lateral) llena el encuadre y `.game-canvas` escala todo a la arena manteniendo 4:3; aceptado como diseño del port |

---

## What is **not** in this spec

- Efectos de sonido (WebAudio) — spec futuro, heredado de SPEC 05.
- Controles táctiles para móvil — spec futuro.
- Pausa con tecla `P`/`Esc` — se controla con el botón del HUD.
- Soporte de mouse — no aplica al tetris (se decidirá en el spec de arkanoid).
- Theme toggle claro/oscuro — tema neón fijo de la plataforma.
- Motores reales para los demás juegos de la biblioteca.
- Supabase Realtime, auth y rate limiting — heredado de SPEC 06.
- Tests automatizados.
