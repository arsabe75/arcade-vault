---
name: create-game
description: Creates a complete new game for Arcade Vault in one command: compact spec with explicit confirmation gate, TypeScript engine (ported from references/started-games/ or built from scratch), wrapper component, registration in src/games/registry.ts, catalog entry with CSS cover, and Supabase leaderboard row. Use it to add a new playable game to the platform.
disable-model-invocation: true
argument-hint: '[id-del-juego]'
---

# /create-game — Creador de juegos para Arcade Vault

## Filosofía

Un juego nuevo en Arcade Vault no es solo un motor: es **spec + motor + wrapper + registro + catálogo + portada + leaderboard**. Si falta una pieza, el juego existe pero no está integrado. Por eso este comando hace en una sola sesión lo que `/spec` y `/spec-impl` hacen por separado:

1. **Primero una spec compacta** (mismo formato que `specs/05` y `06`) y una **confirmación explícita** del usuario antes de tocar código.
2. **Después la implementación**, paso a paso, con pausas para revisar diffs.

La spec va primero porque fija las decisiones que el código no debe improvisar (id, stats del HUD, controles, alcance del port). El código va después, sin desviarse de lo confirmado.

Este comando reutiliza las decisiones ya tomadas en la plataforma:

- **SPEC 05** define el contrato del motor (`EngineCallbacks`, loop, input, callbacks solo al cambiar el valor) y la integración React (HUD como única fuente de verdad, restart por `key`, desmontaje en game over).
- **SPEC 06** define el leaderboard en la nube (Supabase), que es **100% genérico**: un juego nuevo solo necesita su fila en `public.games`.

Lee los templates del propio skill en cada fase:

- `game-spec-template.md` → estructura exacta de la spec compacta (Fase 2).
- `template-engine.md` → esqueleto del motor con el contrato de la plataforma ya resuelto (Fase 3).
- `template-wrapper.md` → esqueleto del wrapper React (Fase 4).

## Flujo de comandos

Sigue las fases en orden. **No saltes fases.** Responde siempre en el idioma del usuario (normalmente español).

### Fase 0 — Contexto

1. Lee `CLAUDE.md` (reglas del proyecto; entre ellas: usar siempre /frontend-design para la UI, incluidas las portadas).
2. Lista `specs/` para conocer el siguiente número secuencial (hoy: 07).
3. Lee al menos `specs/05-asteroids-game.md` y `specs/06-leaderboard-and-games-table.md`: definen el contrato del motor y el setup de Supabase que este comando reutiliza.
4. Comprueba si existe `src/games/registry.ts`. Esto decide la Fase 5:
   - No existe → **Caso A (primera vez):** crear registry + refactor de `GamePlayer.tsx`.
   - Existe → **Caso B:** solo registrar el juego nuevo.
5. Si `$ARGUMENTS` menciona una carpeta de `references/started-games/`, lee su `game.js`, `README.md` y `CLAUDE.md` antes de preguntar.
6. Lee `src/data/games.ts` y detecta entradas placeholder que encajen con el juego (hoy: `caida` ← tetris, `bloque-buster` ← arkanoid; ambas ya tienen portada CSS en `globals.css`).

Si `$ARGUMENTS` llega vacío, la primera pregunta de la Fase 1 pide el id.

### Fase 1 — Preguntas

Pregunta en bloques de 3 a 5, como /spec: opciones concretas, marcando la recomendación y por qué. No preguntes de una en una.

**Bloque A — Identidad y fuente**

> Antes de escribir nada necesito fijar cuatro cosas:
>
> 1. **ID del juego.** En kebab-case; define la ruta `/jugar/<id>`, la clave en `public.games` y la carpeta `src/games/<id>/`. Si hay un placeholder en el catálogo, ¿lo reutilizamos? Recomendación: `caida` (tetris) o `bloque-buster` (arkanoid) — el placeholder ya tiene título, categoría, portada y descripción.
> 2. **Fuente.** ¿Port de `references/started-games/03-tetris` o `04-arkanoid`, o creación desde cero? Recomendación: port si existe referencia — el motor ya está probado.
> 3. **Título visible.** ¿Se mantiene el del placeholder ("CAÍDA", "BLOQUE BUSTER") o se cambia?
> 4. **Entrada del catálogo.** ¿Reutilizamos la entrada existente (solo se corrigen `short`/`long` si hace falta) o creamos una novena entrada? Recomendación: reutilizar cuando el placeholder encaja.

**Bloque B — Datos de catálogo** (solo si se crea una entrada nueva; si se reutiliza, confirmar los textos existentes)

> 1. **Categoría.** ARCADE / PUZZLE / SHOOTER / VERSUS. Recomendación: PUZZLE para tetris, ARCADE para arkanoid.
> 2. **Color de acento.** cyan / magenta / yellow / green. Recomendación: el color actual del placeholder o uno que encaje con la portada.
> 3. **Textos.** `short` (una línea) y `long` (2–3 frases, estilo retro-neón de la plataforma). ¿Los redacto yo y los revisas en la spec? Recomendación: sí.
> 4. **`plays`.** Número estático de la ficha. Recomendación: `"0"` para un juego nuevo; conservar el valor si se reutiliza la entrada.

**Bloque C — Mecánica y HUD**

> 1. **Stats del HUD.** Además de Jugador y Puntuación, ¿qué muestra el HUD? Recomendación: tetris → Líneas y Nivel; arkanoid → Vidas y Nivel; desde cero → las que pida la mecánica (máx. 3).
> 2. **Controles.** Teclas exactas. Recomendación: las del original (tetris: ←/→/↓/↑ o X para rotar, Espacio hard drop; arkanoid: ←/→ y opcionalmente mouse).
> 3. **Fin de partida.** ¿Solo derrota o también victoria? Si hay victoria (arkanoid: 5 niveles, estado `win`), opciones: (a) el último nivel termina y el GameOverModal muestra la puntuación final, (b) bucle infinito subiendo velocidad. Recomendación: (a) — respeta el diseño del original y no inventa niveles.
> 4. **Pausa.** ¿Solo botón PAUSA del HUD, o también tecla? Recomendación: solo botón — consistente con rocas (SPEC 05) y evita conflictos con las teclas del juego.
> 5. **Sonido.** ¿Efectos con WebAudio o sin sonido en esta versión? Recomendación: sin sonido — SPEC 05 lo dejó como spec futuro y el port no debe introducirlo.

**Bloque D — Decisiones del port** (solo si la fuente es una referencia)

> 1. **Canvas.** El tablero de tetris es 300×600 pero el canvas de la plataforma es 800×600 fijo (CSS `.game-canvas` con ratio 4:3). Opciones: (a) mantener la grilla lógica 10×20 y dibujarla centrada/escalada dentro de 800×600, (b) rediseñar la grilla para llenar el ancho. Recomendación: (a) — la lógica del original queda intacta. (Arkanoid ya es 800×600; no aplica.)
> 2. **Sprites y colores.** Arkanoid usa un spritesheet PNG; tetris usa un color por pieza. Recomendación: sprites → dibujo vectorial (rects/líneas) con la paleta neón; piezas del tetris → conservar la identidad de color por pieza, neonizada (la identidad de pieza es mecánica, no decorativa).
> 3. **Elementos fuera de la acción.** Tetris dibuja la pieza "siguiente" en un canvas aparte: opciones (a) dibujarla como parte de la acción en el lateral del canvas 800×600, (b) eliminarla. Recomendación: (a). Arkanoid dibuja botones de "saltar al nivel" en la pausa: se eliminan siempre (la pausa la pinta el HUD).
> 4. **Mouse.** Arkanoid mueve la paleta con el mouse además del teclado. Opciones: (a) solo teclado — consistente con rocas, (b) mouse + teclado. Recomendación: (a); el mouse sobre canvas entra en un spec futuro si se pide.

**Cuándo parar de preguntar** (igual que /spec): cuando puedas responder sin asumir: (1) qué archivos aparecen o cambian, (2) cuál es el primer paso ejecutable y cuál el último, (3) cómo se verifica que el juego está terminado.

### Fase 2 — Spec compacta (gate obligatorio)

Escribe la spec **completa de una pasada** (es compacta: no secciones de una en una como /spec), siguiendo `game-spec-template.md` y las convenciones de `specs/05` y `06`.

1. Determina el número secuencial mirando `specs/` (hoy: 07) y propón slug (recomendación: el id del juego o `<id>-juego`). Confirma el nombre del archivo antes de escribir.
2. Crea `specs/NN-slug.md` con estado `Draft` (Borrador).
3. Muestra la spec completa y espera. **Gate obligatorio — mensaje exacto:**

```
✅ Spec creada: specs/NN-slug.md (estado: Draft)

[objetivo + resumen del plan + criterios de aceptación]

Al confirmar:
1. Marco la spec como "Aprobado" — tu confirmación es la aprobación.
2. Creo y cambio a la rama spec-NN-slug (si AutoCreateBranch en specs/.spec-config.yml lo permite).
3. Empiezo la implementación por el paso 1, con pausa tras cada fase.

¿Confirmas la spec y arranco? [sí/no]
```

- Si responde **no** → preguntar qué cambiar y re-mostrar la spec.
- Si responde **sí** → marcar `Aprobado`, crear la rama `spec-NN-slug` (mismo criterio que /spec-impl: `git checkout -b` salvo `AutoCreateBranch: false` explícito en `specs/.spec-config.yml`) y continuar.

### Fase 3 — Motor `src/games/<id>/engine.ts`

**Si es un port** de `references/started-games/`, aplica esta checklist sobre su `game.js`:

1. TypeScript puro estricto, sin `any`, sin imports de React ni del DOM: el `ctx` llega por parámetro.
2. Loop con `requestAnimationFrame`, `dt` en segundos con cap a 0.05s.
3. **Callbacks solo cuando cambia el valor** (puntuación al sumar, vidas al perder, nivel al cambiar…) — nunca por frame.
4. Entidades como clases con `update(dt)` y `draw(ctx)`.
5. **Canvas siempre 800×600.** Tableros menores (tetris 300×600): mantener la grilla lógica y dibujarla centrada/escalada dentro de 800×600, sin tocar constantes.
6. **Sin restart con tecla en gameover** — el reinicio lo controla el `GameOverModal`.
7. **Sin HUD ni overlays dentro del canvas**: solo la acción. (Tetris: fuera score/líneas/nivel del HUD y el overlay de game over; la pieza "siguiente" se dibuja como acción si se confirmó en la Fase 1. Arkanoid: fuera score/vidas/nivel del canvas, `drawOverlay`, `drawPauseOverlay` y los botones de nivel.)
8. **Paleta neón**: cyan `#00ffff`, amarillo `#f5ff00`, magenta `#ff00ff`. Sprites PNG → dibujo vectorial; piezas del tetris → colores por pieza neonizados.
9. `preventDefault()` en las teclas del juego mientras el estado es `playing`/`dead`.
10. **Fuera**: pausa con tecla (`P`/`Esc`), theme toggle de tetris (tema neón fijo), sonido.
11. **Constantes del original copiadas literalmente** (puntuaciones, velocidades, tamaños). No "corregir" el original: el port es fiel.
12. `destroy()`: `cancelAnimationFrame` + `removeEventListener`, con guard `destroyed`.
13. Listeners de teclado a nivel `window` (keydown/keyup).

**Si es desde cero**: parte de `template-engine.md` (contrato, loop, input, `pause`/`resume`/`destroy` ya resueltos) y rellena solo la lógica del juego: estado `playing | dead | gameover`, vidas, entidades, y los callbacks en los puntos exactos donde cambian los valores. Las mecánicas las fija la spec de la Fase 2; no inventes features fuera de ella.

Al terminar: `npm run build` debe compilar (el motor aún no se usa). Pausa para revisar el diff.

### Fase 4 — Wrapper `src/components/<Name>Game.tsx`

Client Component desde `template-wrapper.md` (espejo de `src/components/AsteroidsGame.tsx`):

- Props: `GameEngineProps` de `@/src/games/registry` (`import type` — nunca import de valor para evitar ciclos).
- `useRef` para el canvas: `<canvas width={800} height={600} className="game-canvas" />`.
- `useEffect` de montaje (deps `[]` + comentario eslint-disable, mismo patrón que AsteroidsGame): instancia el motor, cleanup `destroy()`. Idempotente (StrictMode monta dos veces en dev).
- `useEffect` sobre `paused`: `pause()` / `resume()`.
- Los callbacks de props van al motor sin procesar.
- Si el juego usa stats extra (p. ej. `onLines` de tetris), desestructúralas y pásalas al motor; los juegos que no las usan las ignoran.

Al terminar: compila (aún no conectado). Pausa para revisar el diff.

### Fase 5 — Registry y GamePlayer

**Caso A — Primera vez** (`src/games/registry.ts` no existe):

1. Crear `src/games/registry.ts` con el contenido de abajo (contrato + `GAME_ENGINES` con la entrada `rocas`).
2. `src/games/asteroids/engine.ts`: eliminar la interfaz local `EngineCallbacks` y añadir `import type { EngineCallbacks } from "@/src/games/registry";`. Cero cambio de comportamiento.
3. `src/components/AsteroidsGame.tsx`: sustituir su interfaz local por `GameEngineProps` del registry.
4. Refactor de `src/components/GamePlayer.tsx` (pasos concretos abajo).
5. **Verificación obligatoria del refactor**: `/jugar/rocas` se ve y juega igual que antes, y un juego simulado (`/jugar/bloque-buster`) no cambia en nada.

**Caso B — Registry ya existe:**

Solo añadir la entrada nueva a `GAME_ENGINES` (component + hud). `GamePlayer` ya es genérico. Verificar igualmente que un juego simulado sigue intacto.

**Contenido del registry:**

```ts
"use client";

import type { ComponentType } from "react";
import AsteroidsGame from "@/src/components/AsteroidsGame";

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
 *  callback simplemente no lo desestructuran (p. ej. tetris ignora onLives). */
export interface GameEngineProps extends EngineCallbacks {
  paused: boolean;
  onLines?(lines: number): void; // solo juegos con líneas (tetris)
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
  // caida: {
  //   component: TetrisGame,
  //   hud: [
  //     { key: "score", label: "Puntuación", initial: 0 },
  //     { key: "lines", label: "Líneas", initial: 0 },
  //     { key: "level", label: "Nivel", initial: 1 },
  //   ],
  // },
};

export function getGameEngine(id: string): GameEngineEntry | undefined {
  return GAME_ENGINES[id];
}
```

**Refactor de `GamePlayer.tsx`** (Caso A, pasos concretos):

1. Sustituir `import AsteroidsGame` y `const isRocas = game?.id === "rocas"` por:

   ```tsx
   const entry = game ? getGameEngine(game.id) : undefined;
   const EngineComponent = entry?.component; // mayúscula: obligatorio para JSX
   const hud = entry?.hud ?? SIM_HUD;
   ```

   donde `SIM_HUD` replica el HUD simulado actual:

   ```tsx
   const SIM_HUD: HudStat[] = [
     { key: "score", label: "Puntuación", initial: 0 },
     { key: "lives", label: "Vidas", initial: 3 },
     { key: "level", label: "Nivel", initial: 1 },
   ];
   ```

2. Añadir el estado `lines` y un mapa tipado de setters:

   ```tsx
   const [lines, setLines] = useState(0);

   const statSetters: Record<HudStatKey, (v: number | null) => void> = {
     score: setScore,
     lives: setLives,
     level: setLevel,
     lines: setLines,
     triple: setTriple,
   };
   ```

3. El HUD pasa a ser un loop sobre `hud`: label de la config; valor renderizado con un switch pequeño en GamePlayer: `score` → `toLocaleString("es-ES")`, `lives` → `"♥ ".repeat(v).trim() || "—"`, `level` → `padStart(2, "0")`, `lines` → `String(v)`, `triple` → `3x ${v.toFixed(1)}s`. Omitir stats con `conditional && valor === null`. "Jugador" sigue primero, incondicional.
4. `restart()` genérico: `for (const s of hud) statSetters[s.key](s.initial);` + `setTriple(null)`, `setPaused(false)`, `setOver(false)`, `setRestartKey(k => k + 1)`.
5. La simulación (intervalo de score + level-up) pasa a gatearse por `!entry` en lugar de `!isRocas`; la arena: `entry ? (!over && <EngineComponent key={restartKey} paused={paused} onScore={setScore} onLives={setLives} onLevel={setLevel} onTripleShot={setTriple} onGameOver={handleGameOver} onLines={setLines} />) : (placeholder divs)` — desmontaje en `over` y remount por `key` intactos.
6. Overlay de pausa, CRT, botón FIN, "JUEGO NO ENCONTRADO" y el bloque de `GameOverModal` no cambian.

Esta es la fase de mayor riesgo del flujo: pausa para revisar el diff **siempre**, incluso en modo continuo.

### Fase 6 — Catálogo y portada

1. `src/data/games.ts`: entrada reutilizada (solo corregir `short`/`long` si la Fase 1 lo decidió) o entrada nueva al final del array con los 8 campos (`id, title, short, long, cat, cover, color, plays`).
2. `app/globals.css`: añadir `.cover-<slug>` al final de la sección de portadas (hoy después de `.cover-duelo`), siguiendo el patrón existente: `.cover-bg` + fondo + `::before`/`::after` con la paleta neón. `GameCard` ya renderiza `cover-bg ${game.cover}` — no se toca.
3. **Invoca /frontend-design** para diseñar la portada CSS (regla explícita de CLAUDE.md para toda la UI). La portada es la cara del juego en `/`, `/biblioteca` y `/juego/<id>`.
4. Verificar en `/biblioteca`: la tarjeta nueva muestra la portada sin deformarse.

Pausa para revisar el diff.

### Fase 7 — Leaderboard (Supabase)

El leaderboard es 100% genérico (SPEC 06): `GameOverModal`, `GameDetail`, `HallOfFame` y `Library` funcionan con cualquier `game_id`. Lo único que falta es la fila en `public.games` (FK de `scores`).

1. Crear `supabase/migrations/<YYYYMMDDHHMMSS>_add_game_<id>.sql` (timestamp mayor que el de la última migración):

```sql
-- Alta del juego <id> en el catálogo mínimo de la BD (FK de scores).
-- El catálogo visible sigue en src/data/games.ts (SPEC 06).
insert into public.games (id, title) values
  ('<id>', '<TITLE>')
on conflict (id) do nothing;
```

2. Aplicarla con la herramienta MCP `apply_migration` (name: `add_game_<id>`). Alternativa: `npx supabase db push` — si pide credenciales interactivas, volver al MCP (fallback documentado en SPEC 06).
3. Verificar con `execute_sql`: `select id, title from public.games where id = '<id>';` debe devolver la fila.
4. **No tocar** `GameOverModal`, `GameDetail`, `HallOfFame`, `Library`, `Leaderboard` ni las políticas RLS — no hay nada por juego que cambiar.

**Orden obligatorio**: esta migración se aplica antes del playtest de guardado de la Fase 8. Si guardas sin la fila, el INSERT falla el FK y el modal muestra "NO SE PUDO GUARDAR" (síntoma engañoso).

Pausa para revisar el diff.

### Fase 8 — Verificación y cierre

1. `npm run build` sin errores.
2. `npm run lint` sin errores nuevos (Next 16: `next build` NO lintea; correr ambos).
3. **Playtest con Playwright MCP**: `npm run dev` en background → navegar a `http://localhost:3000/jugar/<id>`:
   - El canvas renderiza la acción y el HUD muestra las stats configuradas.
   - Los controles responden; las teclas del juego no hacen scroll ni re-activan botones.
   - PAUSA congela el juego; REANUDAR continúa; FIN abre el `GameOverModal` con la puntuación real.
   - Perder la última vida abre el modal (sin reinicio con tecla).
   - Guardar iniciales → "▸ PUNTUACIÓN GUARDADA_".
   - JUGAR DE NUEVO → partida limpia; VOLVER AL VAULT → sin errores de consola (el loop murió con el desmontaje).
4. **Leaderboard end-to-end**: tras guardar, `execute_sql` → `select * from public.scores where game_id = '<id>' order by created_at desc limit 3;` muestra la fila; `/juego/<id>` muestra la marca en el leaderboard y "Mejor global"; `/salon` la muestra en la pestaña; la tarjeta en `/` o `/biblioteca` muestra "MEJOR PUNTUACIÓN" con el valor.
5. Repasar los criterios de aceptación de la spec uno por uno.
6. Marcar la spec como `Implementado` y proponer el commit en `spec-NN-slug` (estilo del repo: `STEP 0N: <descripción>`; preguntar antes de commitear).

**Mensaje final:**

```
✅ Juego <id> integrado.

Spec:        specs/NN-slug.md (Implementado)
Motor:       src/games/<id>/engine.ts
Wrapper:     src/components/<Name>Game.tsx
Registry:    src/games/registry.ts (+ entrada en GAME_ENGINES)
Catálogo:    src/data/games.ts + portada .cover-<slug> en globals.css
Leaderboard: migración <timestamp>_add_game_<id>.sql aplicada y fila verificada

Verificación: build ✓ · lint ✓ · playtest ✓ · marca visible en ficha/Salón/biblioteca ✓

¿Hago el commit final en spec-NN-slug?
```

## Puertas de confirmación

- **Gate obligatorio (no saltable): la spec** — fin de la Fase 2.
- **Por defecto: pausa tras cada fase** (3 a 8), con el mensaje:

```
Fase N completada. Archivos tocados:
- src/games/<id>/engine.ts (motor portado)

Revisa el diff. ¿Continúo con la Fase N+1? [sí/no]
```

- El usuario puede decir "continúa sin preguntar" → modo continuo (las pausas se desactivan; el gate de la spec se mantiene siempre).

## Reglas duras

- ❌ **Nunca** implementar sin la spec confirmada. La Fase 2 es el contrato.
- ❌ **Nunca** tocar `GameOverModal`, `GameDetail`, `HallOfFame`, `Library` ni `Leaderboard`: el leaderboard es genérico (SPEC 06). Un cambio ahí significa que algo está mal diseñado.
- ❌ **Nunca** romper el contrato `GameEngineProps` ni el canvas 800×600 (`.game-canvas` tiene ratio 4:3 fijo).
- ❌ **Nunca** dibujar HUD/overlay dentro del canvas: la única fuente de verdad del HUD es React.
- ❌ **Nunca** portar sprites PNG ni sonido como assets: sprites → vectorial neón, sonido → fuera (spec futuro).
- ❌ **Nunca** dejar el reinicio con tecla en gameover del original.
- ❌ **Nunca** alterar los juegos simulados: la rama sin registry de `GamePlayer` se conserva tal cual.
- ❌ **Nunca** aplicar la migración después del playtest de guardado: sin fila en `public.games`, el INSERT falla por FK y el error parece del modal.
- ✅ Responder siempre en el idioma del usuario.
- ✅ Escribir la spec en `specs/NN-slug.md` con el siguiente número secuencial y el formato de `specs/05-06`.
- ✅ Callbacks estables: `GamePlayer` solo pasa setters de estado al motor (nunca closures inline que cambian por render).
- ✅ Verificar con `npm run build` **y** `npm run lint`.
- ✅ Invocar /frontend-design para la portada (regla de CLAUDE.md).

## Tono al preguntar

Sé directo y concreto. No pidas disculpas por preguntar. El usuario invocó este comando precisamente porque quieres fijar decisiones antes de escribir código. Usa preguntas concretas, una por línea, numeradas, con opciones y una recomendación marcada.

## Argumentos

`/create-game caida` → usa `caida` como id sugerido (confirmar en la Fase 1). `/create-game` sin argumentos → la primera pregunta pide el id.

## Mantenimiento

Este skill vive duplicado byte-idéntico en `.claude/skills/create-game/` y `.agents/skills/create-game/`. Todo cambio futuro se aplica a las dos copias. `skills-lock.json` no se toca: solo rastrea skills descargados de GitHub.
