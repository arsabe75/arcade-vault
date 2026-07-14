# SPEC 01 — MVP visual de Arcade Vault

> **Status:** Implemented
> **Depends on:** Ninguno
> **Date:** 2026-07-13
> **Objective:** Implementar todas las pantallas del Arcade Vault (Biblioteca, Detalle, Reproductor, Auth, Salón de la Fama) con su interactividad de UI y diseño visual retro-neón responsive, usando Next.js 16, React 19, Tailwind CSS v4 y TypeScript, sin lógica real de juegos ni autenticación.

---

## Scope

**In:**

- Navegación completa con Navbar (sticky, logo, enlaces, créditos, botón de auth, menú hamburger móvil)
- Pantalla Biblioteca (`/`) con hero, buscador por texto, filtro por categorías (chips), grid de tarjetas de juegos con efecto tilt 3D, y estado vacío ("No hay resultados")
- Pantalla Detalle (`/juego/[id]`) con cover art, tags, título neón, descripción larga, stat strip (partidas, mejor global, dificultad), botones de acción, y leaderboard lateral con top 3 dorado/plata/bronce
- Pantalla Reproductor (`/jugar/[id]`) con HUD (jugador, puntuación, vidas, nivel), pantalla CRT con simulación cosmética (score auto-incremental, enemigos animados, nave del jugador), botones de pausa/fin/salir, y modal de Game Over con input de iniciales y guardado de puntuación
- Pantalla Auth (`/auth`) con tabs Iniciar Sesión / Crear Cuenta, formulario con campos usuario/email/contraseña, botón "Entrar al Vault", opción "Jugar como invitado", botones sociales (Google, GitHub), y texto de términos
- Pantalla Salón de la Fama (`/salon`) con header, tabs de juegos, podio (oro/plata/bronce), tabla de clasificación con fila "Tu mejor marca" resaltada, y botón volver
- Footer global con copyright y versión
- Datos mock (8 juegos, categorías, puntuaciones generadas con seed deterministico) en archivo TypeScript
- Fuentes: Press Start 2P, JetBrains Mono (vía next/font/google)
- Diseño responsive completo (móvil, tablet, desktop)
- Animaciones CSS: flicker, blink, scanlines, grid scroll, CRT, fade-in, slide-in, pulse, tilt 3D en tarjetas, rise en filas de tabla
- Tema oscuro retro-neón con variables CSS (cyan, magenta, yellow, green, gold)
- Interactividad de UI: búsqueda con filtrado en tiempo real, tabs, menú móvil, efecto tilt, modal Game Over, simulación cosmética del reproductor

**Out of scope (for future specs):**

- Implementación real de juegos (lógica de juego, puntuación, colisiones)
- Autenticación real (OAuth, JWT, sesiones, base de datos)
- Persistencia real de puntuaciones (solo localStorage cosmético se mantiene)
- API backend
- Tests automatizados
- Modo multijugador
- Sonido / música

---

## Data model

### `src/data/games.ts`

```ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export const GAMES: Game[] = [
  // 8 juegos tal cual en el template data.jsx
];

export const CATS: string[] = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

### `src/data/players.ts`

```ts
export const PLAYERS: string[] = [
  "PX_KAI",
  "NEONFOX",
  "Z3R0COOL", // ... 18 nombres
];
```

### Sin modelo de persistencia

El auth y las puntuaciones guardadas son cosméticos. Se usa `localStorage` directamente en el lado cliente con los mismos keys del template (`av_user`, `av_scores`), sin capa de abstracción. No hay modelo de base de datos ni API.

---

## Implementation plan

### Step 1 — Datos mock y tipos

Crear `src/data/games.ts` con la interfaz `Game`, el array `GAMES` (8 juegos), `CATS`, `PLAYERS`, y la función `seededScores`. El sistema compila y los datos están disponibles para el resto del proyecto.

### Step 2 — Fuentes y estilos base

- Cargar Press Start 2P y JetBrains Mono vía `next/font/google` en el root layout.
- Configurar `globals.css` con las variables CSS del tema retro-neón (`--bg`, `--cyan`, `--magenta`, `--yellow`, `--green`, `--gold`, etc.) y los estilos base (body, fondos con grid en perspectiva, scanlines, ruido).
- Verificar que el layout renderiza el fondo retro correctamente.

### Step 3 — Componentes compartidos: Button, Nav y Footer

Crear `src/components/`:

- `Button.tsx` — botón neón con variantes (`cyan`, `magenta`, `yellow`, `ghost`), tamaños (`lg`, `xl`), y animación `pulse`. Clip-path con esquinas recortadas.
- `Nav.tsx` — "use client", sticky, logo, enlaces de navegación con indicador activo, contador de créditos, botón de auth/sesión, menú hamburger + panel móvil lateral.
- `Footer.tsx` — server component con copyright y versión.

### Step 4 — Layout raíz

Actualizar `app/layout.tsx` para incluir `Nav` y `Footer`. El layout debe tener la estructura: fondo → ruido → nav → contenido → footer. El `main` crece con flex-1.

### Step 5 — Pantalla Biblioteca (home, `/`)

Crear `app/page.tsx` (server component) que renderiza el cliente `Library` component:

- `src/components/Library.tsx` — "use client", estado para búsqueda y categoría, filtrado con `useMemo`, renderiza hero + filtros + grid.
- `src/components/GameCard.tsx` — "use client", efecto tilt 3D con `onMouseMove`/`onMouseLeave`, cover art CSS, meta, badge de puntuación, botón jugar.
- Estado vacío: mensaje "NO HAY RESULTADOS" cuando `filtered.length === 0`.
- Las portadas (cover art) se renderizan con clases CSS de Tailwind + estilos custom en globals.css.

### Step 6 — Pantalla Detalle (`/juego/[id]`)

Crear `app/juego/[id]/page.tsx`:

- `src/components/GameDetail.tsx` — "use client", recibe `id` por props, busca el juego en `GAMES`, renderiza cover, tags, título neón, descripción, stat strip, botones de acción, y leaderboard lateral.
- `src/components/Leaderboard.tsx` — tabla de puntuaciones con top 3 destacado (oro/plata/bronce), recibe array de `ScoreRow`.

### Step 7 — Pantalla Reproductor (`/jugar/[id]`)

Crear `app/jugar/[id]/page.tsx`:

- `src/components/GamePlayer.tsx` — "use client", HUD con jugador/puntuación/vidas/nivel, pantalla CRT con arena de juego simulada (grid floor, nave, enemigos animados con CSS), botones pausa/fin/salir.
- `src/components/GameOverModal.tsx` — modal con puntuación final, input de iniciales, botón guardar, animación typewriter en "PUNTUACIÓN GUARDADA".
- Simulación: score auto-incrementa vía `setInterval`, nivel sube cada 2500 puntos, pausa detiene el intervalo.

### Step 8 — Pantalla Auth (`/auth`)

Crear `app/auth/page.tsx`:

- `src/components/AuthForm.tsx` — "use client", tabs Iniciar Sesión / Crear Cuenta, formulario con campos, botón submit, botón "Jugar como invitado", botones sociales, texto de términos.
- Submit y "invitado" guardan en localStorage (`av_user`) y redirigen a `/`.

### Step 9 — Pantalla Salón de la Fama (`/salon`)

Crear `app/salon/page.tsx`:

- `src/components/HallOfFame.tsx` — "use client", tabs de juegos, podio con top 3, tabla completa con animación `rise`, fila "Tu mejor marca" si hay usuario en localStorage.
- `src/components/Podium.tsx` — tres slots (oro/plata/bronce).

### Step 10 — Responsive final y pulido

- Ajustar breakpoints en todos los componentes (móvil ~720-900px).
- Verificar que los fondos (grid en perspectiva, scanlines, ruido) se ven correctamente en todos los tamaños.
- Animaciones: fade-in en cambio de página, rise en filas de tabla, flicker en títulos, blink en cursor, pulse en botones, tilt en tarjetas, typewriter en toast.

---

## Acceptance criteria

- [ ] La app compila y arranca sin errores con `npm run dev`.
- [ ] La página principal (`/`) muestra el hero "ARCADE VAULT", el buscador, los chips de categorías, y el grid de 8 tarjetas de juegos.
- [ ] Escribir en el buscador filtra las tarjetas en tiempo real por nombre.
- [ ] Seleccionar una categoría en los chips filtra las tarjetas y resalta el chip activo.
- [ ] Cuando el filtro no da resultados, se muestra el mensaje "NO HAY RESULTADOS".
- [ ] Las tarjetas tienen efecto tilt 3D al mover el mouse y regresan a su posición al salir.
- [ ] Al hacer clic en una tarjeta (o su botón JUGAR) se navega a `/juego/[id]`.
- [ ] La pantalla de detalle (`/juego/[id]`) muestra el cover art, tags, título neón, descripción larga, stat strip con 3 stats, botón "JUGAR AHORA", y leaderboard lateral con 10 filas.
- [ ] El leaderboard muestra el top 1 en dorado, top 2 en plata, top 3 en bronce.
- [ ] Al hacer clic en "JUGAR AHORA" se navega a `/jugar/[id]`.
- [ ] La pantalla del reproductor (`/jugar/[id]`) muestra el HUD con nombre del jugador, puntuación (auto-incrementándose), vidas (♥ ♥ ♥), y nivel.
- [ ] El botón PAUSA detiene el contador de puntuación y muestra overlay "EN PAUSA"; REANUDAR lo continúa.
- [ ] El botón FIN detiene el juego y abre el modal de Game Over con la puntuación final.
- [ ] El modal de Game Over permite ingresar iniciales, guardar puntuación (muestra "PUNTUACIÓN GUARDADA" con animación typewriter), y ofrece "JUGAR DE NUEVO" o "VOLVER AL VAULT".
- [ ] La pantalla CRT muestra el grid floor animado, enemigos con drift, y la nave del jugador con animación bob.
- [ ] La pantalla Auth (`/auth`) muestra tabs "INICIAR SESIÓN" / "CREAR CUENTA" y cambia entre ellas.
- [ ] El tab "CREAR CUENTA" muestra un campo adicional de correo electrónico.
- [ ] El formulario de auth permite submit (redirige a `/`) y tiene botón "JUGAR COMO INVITADO".
- [ ] Los botones sociales (Google, GitHub) están visibles pero son decorativos.
- [ ] La pantalla Salón de la Fama (`/salon`) muestra el podio con top 3 (oro/plata/bronce) y la tabla completa con 12 filas.
- [ ] Los tabs de juegos en el Salón cambian el podio y la tabla según el juego seleccionado.
- [ ] Si el usuario está "logueado" (localStorage), aparece la fila "Tu mejor marca" resaltada en amarillo.
- [ ] El Navbar es sticky, muestra logo, enlaces (Biblioteca, Salón de la Fama), créditos, y botón de sesión.
- [ ] El enlace activo en el Navbar tiene el indicador cyan con glow.
- [ ] En móvil (≤840px), los enlaces del Navbar se ocultan y aparece el botón hamburger; el panel móvil se desliza desde la derecha.
- [ ] El footer se muestra en todas las páginas con "© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0".
- [ ] Las fuentes Press Start 2P y JetBrains Mono se cargan correctamente.
- [ ] En móvil (≤720-900px según el componente), el layout se adapta: grid de 1 columna en biblioteca, detalle apilado vertical, podio vertical, tabla compacta.
- [ ] El build de producción (`npm run build`) completa sin errores.

---

## Decisions

- **Sí:** Next.js 16 App Router con rutas basadas en filesystem (`/`, `/juego/[id]`, `/jugar/[id]`, `/auth`, `/salon`). Es la arquitectura nativa del framework y evita hash-routing innecesario.
- **No:** Hash routing (`#biblioteca`, `#detalle`, etc.) como en el template original. Next.js App Router lo hace redundante y rompe convenciones del ecosistema.
- **Sí:** Tailwind CSS v4 para todos los estilos. Las clases utilitarias cubren layout, espaciado, tipografía, colores, y estados. Las animaciones complejas (scanlines, CRT, grid scroll, flicker, typewriter) y los fondos (grid en perspectiva, ruido) van en `globals.css` como complemento porque requieren keyframes y pseudo-elementos que Tailwind no expresa bien.
- **No:** CSS Modules o styled-components. Añadirían una capa extra sin beneficio frente a Tailwind + un archivo global para lo que Tailwind no cubre.
- **Sí:** Componentes "use client" para todo lo interactivo (Nav, Library, GameCard, GameDetail, GamePlayer, AuthForm, HallOfFame) y Server Components para el layout raíz, las páginas y el Footer. Es el modelo de Next.js 16: server by default, client donde hay estado/eventos.
- **No:** Server Actions para el auth. El auth es cosmético, no justifica la complejidad.
- **Sí:** Datos mock en `src/data/games.ts` con tipos TypeScript exportados. Centraliza la fuente de verdad y permite que cualquier componente importe los datos sin prop drilling.
- **Sí:** localStorage directo en componentes cliente para simular persistencia de usuario y puntuaciones. Mismos keys que el template original (`av_user`, `av_scores`). Cero fricción, cero dependencias.
- **No:** Estado global (Context, Zustand, Redux). Con 5 pantallas y datos mock, el prop drilling y localStorage son suficientes.
- **Sí:** Fuentes Google (Press Start 2P, JetBrains Mono) cargadas con `next/font/google`. Es la forma óptima en Next.js: sin CLS, con subset automático, y caching en el edge.
- **No:** CDN de Google Fonts como en el template. `next/font/google` es superior en rendimiento y es la convención del framework.
- **Sí:** Carpeta `src/components/` para todos los componentes reutilizables. Sigue la convención del ecosistema Next.js y mantiene las páginas limpias.
- **Sí:** Simulación cosmética del reproductor (score auto-incremental con setInterval, enemigos animados con CSS). Da vida a la pantalla sin implementar lógica de juego real.

---

## Risks

| Risk                                                                                                                                                           | Mitigation                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Las animaciones CSS del template (perspective grid, scanlines, CRT con pseudo-elementos) no se traducen a Tailwind y requieren estilos custom en `globals.css` | Mantener en `globals.css` solo los estilos que Tailwind no puede expresar (~200 líneas estimadas: keyframes, pseudo-elementos complejos, máscaras, clip-path). Todo lo demás va con clases de Tailwind. |
| `localStorage` no está disponible durante SSR en Next.js, lo que puede romper componentes que intenten leer `av_user` en el primer render                      | Envolver accesos a `localStorage` en `try/catch` y usar lazy initializers (`useState(() => { try { ... } catch { return null } })`) como ya hace el template original.                                  |
| Press Start 2P es una fuente pesada (~70KB por variante) que puede afectar el LCP                                                                              | Usar `next/font/google` con `subset: ['latin']` y `display: 'swap'` para que el texto sea visible con fallback mientras carga.                                                                          |
| Next.js 16 usa `params` como Promise, lo cual difiere del patrón del template                                                                                  | Usar `await params` en las páginas `[id]` como documenta Next.js 16. Tipar con `PageProps<'/juego/[id]'>`.                                                                                              |
| El efecto tilt 3D usa `transformStyle: 'preserve-3d'` y manipulación directa del DOM vía refs                                                                  | Implementarlo como Client Component con `useRef` y eventos `onMouseMove`/`onMouseLeave` sobre el elemento, igual que el template.                                                                       |

---

## What is **not** in this spec

- Juegos reales (lógica, colisiones, puntuación real).
- Autenticación real (OAuth, JWT, base de datos).
- API backend.
- Tests automatizados.
- Sonido o música.
- Modo multijugador.
