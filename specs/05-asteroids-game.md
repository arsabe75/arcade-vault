# SPEC 05 — Juego Asteroids (ROCAS)

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-16
> **Objective:** Portar el juego de Asteroids de `references/started-games/02-asteroids/` a la plataforma como el primer juego real en `/jugar/rocas`: motor portado a TypeScript puro (`src/games/asteroids/engine.ts`), componente React con canvas integrado en el `GamePlayer` existente (HUD, CRT y `GameOverModal` con guardado en `localStorage`).

---

## Scope

**In:**

- Portar el motor completo de `references/started-games/02-asteroids/game.js` a TypeScript puro en `src/games/asteroids/engine.ts` (clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, constantes y estados originales intactos)
- Nueva clase `AsteroidsEngine` que encapsula el loop (`requestAnimationFrame`), el input de teclado, y expone callbacks de HUD (`onScore`, `onLives`, `onLevel`, `onTripleShot`, `onGameOver`) y control (`pause`, `resume`, `destroy`)
- Nuevo componente `src/components/AsteroidsGame.tsx` (Client Component) que monta el canvas, instancia el motor en `useEffect` con cleanup, y recibe `paused` como prop
- Refactor de `src/components/GamePlayer.tsx`: cuando `id === "rocas"` renderiza el juego real dentro de la arena del CRT; el resto de juegos conserva la simulación actual
- HUD de React como única fuente de verdad (puntuación, vidas, nivel, temporizador 3x) sincronizado vía callbacks del motor; se elimina el HUD interno del canvas original
- Adaptación visual a la paleta neón de Arcade Vault (nave cyan, asteroides amarillos, balas magenta, powerup cyan, partículas blancas)
- Actualizar la descripción (`long`) de la entrada `rocas` en `src/data/games.ts` para que coincida con el juego real
- Estilos en `globals.css` para escalar el canvas 800×600 dentro de la arena manteniendo proporción 4:3
- Guardado de puntuación reutilizando el `GameOverModal` existente (`localStorage` `av_scores`, clave `rocas`)

**Out of scope (for future specs):**

- High scores en la nube con Supabase (tabla de scores, RLS) — difierido explícitamente por SPEC 04 a un spec futuro
- Controles táctiles / botones en pantalla para móvil — el canvas se ve bien en móvil pero solo se juega con teclado
- Efectos de sonido (WebAudio)
- Pausa con tecla (`P`/`Esc`) — la pausa se controla solo con el botón del HUD en este spec
- Migrar los demás juegos simulados a motores reales
- OVNIs (el juego de referencia no los incluye; la mención actual en la descripción de `rocas` se elimina)
- Tests automatizados

---

## Data model

### Motor — `src/games/asteroids/engine.ts`

TypeScript puro, sin dependencias de React ni del DOM (recibe el `ctx` del canvas por parámetro). Nuevo directorio `src/games/<id>/` como convención para los motores de los futuros juegos.

```ts
export interface EngineCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onTripleShot(secondsLeft: number | null): void; // null cuando el powerup expira
  onGameOver(score: number): void;
}

export class AsteroidsEngine {
  constructor(ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks);
  pause(): void; // congela el loop (no update ni draw)
  resume(): void;
  destroy(): void; // cancelAnimationFrame + removeEventListener
}
```

- Los callbacks se disparan **solo cuando cambia el valor** (puntuación al sumar, vidas al perder, nivel al avanzar, temporizador 3x cuando cambia su valor con 1 decimal) para no re-renderizar React por frame.
- El estado interno es el del original: `state: 'playing' | 'dead' | 'gameover'`, `score`, `lives`, `level`, `deadTimer`, arrays de `bullets`, `asteroids`, `particles`, `powerUps`.
- Se conservan todas las constantes del original: `RADII = [0, 16, 30, 50]`, `SPEEDS = [0, 85, 55, 32]`, `POINTS = [0, 100, 50, 20]`, 3 vidas, invencibilidad 3s, `POWERUP_DROP_CHANCE = 0.15` (garantizado a los 5 kills), `POWERUP_DURATION = 5`, `POWERUP_TTL = 12`, `TRIPLE_SPREAD = 0.18`, cap de `dt` a 50ms, canvas interno 800×600 con envolvimiento toroidal.
- Cambios respecto al original (los únicos cuatro):
  1. **Se elimina el restart con Espacio en `gameover`.** En la plataforma el reinicio lo controla el `GameOverModal`.
  2. **Se elimina el HUD interno del canvas** (`drawHUD`, `drawLifeIcon`, `drawOverlay` y el texto 3x). Solo se dibuja la acción. El overlay de "GAME OVER" lo pinta el modal de React.
  3. **Paleta neón** en lugar de blanco: nave `#00ffff` (cyan), asteroides `#f5ff00` (amarillo), balas `#ff00ff` (magenta), powerup `#00ffff` (cyan, ya lo era), partículas `rgba(255,255,255,α)` y llama del propulsor `rgba(255,130,0,0.85)` (ambas ya del original).
  4. **`preventDefault()`** en las teclas del juego (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `Space`) mientras el estado es `playing` o `dead`, para que Espacio no re-dispare un botón enfocado del HUD y las flechas no hagan scroll. No se hace `preventDefault` en `gameover` (el componente ya se desmontó en ese punto, pero queda documentado).

### Componente — `src/components/AsteroidsGame.tsx`

```ts
interface AsteroidsGameProps {
  paused: boolean;
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onTripleShot(secondsLeft: number | null): void;
  onGameOver(score: number): void;
}
```

- Client Component con `"use client"`. Crea el `<canvas width={800} height={600}>` con `useRef`.
- `useEffect` de montaje: instancia `AsteroidsEngine` y arranca el loop. Cleanup: `engine.destroy()`.
- `useEffect` sobre `paused`: llama `engine.pause()` / `engine.resume()`.
- Los callbacks del motor se reenvían a las props sin procesar.

### Cambios en `GamePlayer.tsx`

- Estado nuevo: `triple` (número | null) y `restartKey` (número).
- Si `game.id === "rocas"`:
  - La arena renderiza `<AsteroidsGame key={restartKey} ... />` en lugar de la simulación (`grid-floor`, `enemy`, `player-ship`).
  - El HUD usa el estado real: puntuación, `"♥ ".repeat(lives)`, nivel, y una línea cyan `3x 4.2s` cuando `triple !== null`.
  - El componente se desmonta cuando `over === true` (el modal con su backdrop cubre la arena).
  - `restart()` incrementa `restartKey` (remonta el motor limpio) y resetea score/vidas/nivel/triple.
- Si el juego no es `rocas`: se mantiene la simulación actual exactamente como está (efectos de score/level-up solo para este camino).
- Botón FIN: `setOver(true)` (la puntuación ya está sincronizada en el estado). PAUSA y SALIR funcionan igual que hoy.

### Datos estáticos — `src/data/games.ts`

Solo cambia el texto `long` de la entrada `rocas`. Nueva descripción que describe el juego real: partición de asteroides en fragmentos, 3 vidas, niveles progresivos y powerup de triple disparo. Se elimina la mención a los OVNIs. El resto de campos (`id`, `title`, `short`, `cat`, `cover`, `color`, `best`, `plays`) no cambia.

### Estilos — `globals.css`

Nueva clase `.game-canvas` para el canvas real: ocupa el ancho/alto disponible de la arena (`max-width: 100%`, `max-height: 100%`), mantiene `aspect-ratio: 4/3`, centrado, `display: block`.

---

## Implementation plan

### Step 1 — Crear el motor `src/games/asteroids/engine.ts`

Portar `game.js` a TypeScript puro (strict mode, sin `any`): clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, constantes, y la clase `AsteroidsEngine` con el loop, input, callbacks, `pause`/`resume`/`destroy`. Aplicar los 4 cambios del Data model (sin restart con Espacio, sin HUD interno, paleta neón, `preventDefault` condicionado). El sistema compila; el motor aún no se usa.

### Step 2 — Crear el componente `src/components/AsteroidsGame.tsx`

Client Component según el Data model: canvas 800×600 con `useRef`, instancia del motor en `useEffect` con cleanup, `useEffect` para `paused`, reenvío de callbacks. El sistema compila; el componente aún no está conectado.

### Step 3 — Refactor de `GamePlayer.tsx` con dispatch por juego

Aplicar los cambios del Data model: rama real para `rocas`, rama simulada para el resto, estado `triple`/`restartKey`, HUD con indicador 3x, desmontaje en game over, remount en restart. Verificar manualmente que `/jugar/bloque-buster` (simulado) se ve y funciona igual que antes.

### Step 4 — Actualizar la descripción de `rocas` en `src/data/games.ts`

Reemplazar `long` con la descripción del juego real (sin OVNIs). Verificar que `/biblioteca` y `/juego/rocas` muestran el texto nuevo.

### Step 5 — Agregar estilos `.game-canvas` a `globals.css`

Clase para escalar el canvas manteniendo 4:3 dentro de la arena, centrado. Verificar en viewports de desktop y móvil.

### Step 6 — Verificar

- `npm run build` sin errores.
- `npm run lint` sin errores nuevos en los archivos de este spec (los errores pre-existentes de `main` siguen con su salvedad de SPEC 04).
- Playtest completo en `/jugar/rocas` según los acceptance criteria.

---

## Acceptance criteria

- [x] `/jugar/rocas` renderiza el juego real en canvas dentro del CRT, sin errores en la consola.
- [x] `←`/`→` rotan la nave y `↑` propulsa; `Espacio` dispara con cooldown de 0.2s.
- [x] Las teclas del juego no hacen scroll de página ni re-activan botones enfocados del HUD.
- [x] Un asteroide grande suma 20, mediano 50, pequeño 100, y el HUD de React refleja la puntuación real al instante.
- [x] Un asteroide grande se parte en 2 medianos; cada mediano en 2 pequeños; los pequeños desaparecen.
- [x] La nave tiene 3 vidas con 3 segundos de invencibilidad (parpadeo) al reaparecer; el HUD muestra las vidas reales.
- [x] Al eliminar todos los asteroides sube de nivel y aparecen `3 + nivel` asteroides nuevos; el HUD muestra el nivel real.
- [x] El powerup 3x aparece (15% por kill, garantizado al quinto kill), dura 5 segundos, dispara en abanico triple, y su temporizador se muestra en el HUD mientras está activo.
- [x] El botón PAUSA congela el juego y muestra el overlay "EN PAUSA"; REANUDAR continúa exactamente donde estaba.
- [x] El botón FIN abre el `GameOverModal` con la puntuación real del momento.
- [x] Al perder la tercera vida, el `GameOverModal` aparece con la puntuación final real, sin reinicio automático con Espacio.
- [x] "GUARDAR PUNTUACIÓN" escribe en `localStorage` la clave `av_scores` → `rocas` con `{ initials, score }` reales.
- [x] "JUGAR DE NUEVO" inicia una partida limpia (puntuación 0, 3 vidas, nivel 1, sin powerups activos).
- [x] "VOLVER AL VAULT" navega sin que el loop siga corriendo: no quedan listeners ni errores de consola.
- [x] `/jugar/bloque-buster` y el resto de juegos simulados se ven y funcionan igual que antes de este spec.
- [x] La ficha de `rocas` en `/biblioteca` y `/juego/rocas` muestra la descripción actualizada, sin mención a OVNIs.
- [x] El canvas se escala manteniendo proporción 4:3 y centrado en desktop y en móvil, sin deformación.
- [x] `npm run build` completa sin errores.
- [x] `npm run lint` no introduce errores nuevos en `src/games/`, `src/components/AsteroidsGame.tsx` ni `src/components/GamePlayer.tsx`.

---

## Decisions

- **Sí:** Motor portado a TypeScript puro en `src/games/asteroids/engine.ts`, separado del componente. La lógica queda testeable sin React y el componente se limita a conectar canvas ↔ motor ↔ props. Se estrena la convención `src/games/<id>/` para los motores de los próximos juegos.
- **No:** Un solo archivo con motor y componente mezclados. Un port de ~420 líneas de lógica dentro de un componente es difícil de mantener.
- **Sí:** Reutilizar la entrada `rocas` existente en `GAMES`. Es el placeholder evidente de este juego (título, categoría SHOOTER, portada y color ya definidos). Solo se corrige su descripción.
- **No:** Crear una entrada nueva `asteroides`. Duplicaría el juego en la biblioteca o exigiría migrar referencias sin beneficio.
- **Sí:** Paleta neón de Arcade Vault (cyan/magenta/amarillo) en el canvas, conservando siluetas y mecánicas idénticas al original.
- **No:** Blanco sobre negro clásico. Rompería la identidad visual de la plataforma dentro del CRT.
- **Sí:** HUD de React como única fuente de verdad, sincronizado por callbacks del motor. Reutiliza el HUD, CRT y modal existentes; el canvas solo dibuja la acción.
- **No:** Conservar el HUD interno del canvas. Duplicaría estado (dos puntuaciones visibles) y rompería la consistencia con el resto de la plataforma.
- **Sí:** Callbacks que solo se disparan cuando cambia el valor mostrado. Evita re-renderizar React en cada frame del loop.
- **No:** Polling del estado del motor desde React (leer el motor por intervalos). Es más frágil y menos limpio que los callbacks.
- **Sí:** Guardado con el flujo actual: `GameOverModal` + `localStorage` (`av_scores`, clave `rocas`). No se toca el formato existente.
- **No:** Supabase en este spec. SPEC 04 difirió los high scores en la nube a un spec futuro; este spec no pisa esa decisión.
- **Sí:** Eliminar el reinicio con Espacio en game over. En la plataforma el reinicio lo controla el modal, y además el input de iniciales necesita el teclado libre.
- **Sí:** Desmontar `AsteroidsGame` al terminar (FIN o game over) y remontarlo con `key` al reiniciar. Es el patrón React más limpio: el cleanup del `useEffect` garantiza que el loop y los listeners mueren con el componente.
- **No:** Controlar el ciclo de vida del motor con refs imperativas desde `GamePlayer`. Añade complejidad sin beneficio para un solo juego real.
- **Sí:** Solo teclado en esta versión. El juego original es de teclado; los controles táctiles merecen su propio spec con diseño de botones.
- **No:** Sonido en este spec. El original no tiene; los efectos WebAudio van en un spec futuro.
- **Sí:** Mantener el powerup 3x del código original (aunque su README no lo mencione). Es parte del juego tal como está creado; se muestra su temporizador en el HUD de React.
- **No:** Registrar el juego real en un sistema de registry de motores. Con un solo juego real, un condicional por `id` en `GamePlayer` es suficiente; el registry se justifica cuando exista un segundo motor.

---

## Risks

| Risk                                                                                                                    | Mitigation                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Espacio` re-activa el último botón enfocado del HUD (ej. PAUSA) mientras se juega                                      | El motor hace `preventDefault()` en las teclas del juego mientras el estado es `playing`/`dead`. Además, al abrirse el modal el componente se desmonta y sus listeners desaparecen, dejando el teclado libre para el input de iniciales. |
| El loop o los listeners siguen vivos al navegar fuera de `/jugar/rocas` (fugas de memoria, errores de consola)          | `destroy()` en el cleanup del `useEffect` (cancela `requestAnimationFrame` y `removeEventListener`). El desmontaje en game over y el remount con `key` pasan por el mismo camino.                                                        |
| React StrictMode en dev monta/desmonta dos veces el efecto                                                              | El efecto de montaje es idempotente (crea el motor y arranca el loop; el cleanup destruye todo). El doble montaje en dev no deja estado residual.                                                                                        |
| El HUD de React se desincroniza o re-renderiza en exceso por actualizaciones por frame                                  | Los callbacks solo se disparan cuando cambia el valor mostrado; el temporizador 3x solo al cambiar su primer decimal.                                                                                                                    |
| El canvas 800×600 se deforma o desborda la arena en pantallas pequeñas                                                  | `.game-canvas` con `max-width/max-height: 100%` y `aspect-ratio: 4/3`, centrado.                                                                                                                                                         |
| El port de TypeScript altera por error una constante del juego original (puntuaciones, velocidades, chances de powerup) | Las constantes se copian literalmente del `game.js` de referencia; los acceptance criteria verifican puntuación, partición y powerup en el playtest.                                                                                     |
| Las flechas del teclado hacen scroll de la página mientras se juega                                                     | `preventDefault()` en `ArrowLeft`/`ArrowRight`/`ArrowUp` durante la partida.                                                                                                                                                             |

---

## What is **not** in this spec

- High scores en la nube con Supabase (spec futuro, heredado de SPEC 04).
- Controles táctiles para móvil (spec futuro).
- Efectos de sonido (spec futuro).
- Pausa con tecla `P`/`Esc` (se controla con el botón del HUD).
- Motores reales para los demás juegos de la biblioteca.
- OVNIs u otras mecánicas nuevas: el port es fiel al juego de referencia.
- Tests automatizados.
