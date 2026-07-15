# SPEC 02 — Home page con hero, features, y secciones de conversión

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-07-15
> **Objective:** Reemplazar la página principal (`/`) con la Home page completa del template (Hero, ¿Por qué Arcade Vault?, Juegos Disponibles, Stats, Actividad en Vivo, Precios, CTA Final) y mover la Biblioteca actual a la ruta `/biblioteca`.

---

## Scope

**In:**

- Nueva página Home (`/`) con 6 secciones: Hero con siluetas flotantes, ¿Por qué Arcade Vault? (feature cards), Juegos Disponibles Ahora (mini cards), Stats (bloque de estadísticas), Actividad en Vivo (ticker de puntuaciones + top jugadores), Precios (plan gratuito + FAQ), y CTA Final
- Componente `Home` como Client Component con animaciones de reveal al hacer scroll (IntersectionObserver)
- Subcomponentes: `FloatingSilhouettes` (SVGs decorativos de pixel art), `MiniCard` (tarjeta compacta de juego), `FeatureIcon` (íconos pixel para features)
- Nueva ruta `/biblioteca` que renderiza el componente `Library` existente (hoy en `/`)
- Actualizar `Nav` para agregar enlace "Biblioteca" y cambiar lógica de enlace activo: "Inicio" activo en `/`, "Biblioteca" activo en `/biblioteca` y rutas hijas
- Estilos CSS para todas las secciones de la Home en `globals.css` (~150 líneas: `.home-hero`, `.home-title`, `.feature-grid`, `.mini-rail`, `.home-stats`, `.activity-grid`, `.ticker`, `.pricing-grid`, `.home-final`, `.reveal`, y animaciones `float`, `bounce`)
- Reutilizar datos de `src/data/games.ts` (`GAMES`) para la sección "Juegos Disponibles Ahora"

**Out of scope (for future specs):**

- Página About (`/about`) y formulario de contacto — va en otro spec
- Conectar ticker de actividad con datos reales de localStorage — se mantiene mock hardcodeado
- Modificar el componente `Library` — solo se mueve de ruta, su funcionalidad no cambia
- Modificar `GameCard` u otros componentes existentes

---

## Data model

Este spec no introduce nuevas estructuras de datos. Reutiliza el modelo de SPEC 01:

- **`src/data/games.ts`** — El array `GAMES` (8 juegos) se usa en la sección "Juegos Disponibles Ahora" para renderizar las `MiniCard`. No se modifica el archivo.
- **Datos mock hardcodeados** — La actividad en vivo (ticker de puntuaciones recientes y top jugadores del día) y los precios/FAQ son datos estáticos definidos directamente en el componente `Home`, sin capa de datos separada. Son literales que no cambian.
- **Sin nueva persistencia** — Nada se lee ni escribe en localStorage desde la Home page.

---

## Implementation plan

### Step 1 — Mover Library a `/biblioteca`

Crear `app/biblioteca/page.tsx` que importe y renderice el componente `Library` (idéntico a como está hoy en `app/page.tsx`). El sistema compila y `/biblioteca` muestra la grilla de juegos.

### Step 2 — Crear página Home en `/`

Actualizar `app/page.tsx` para que importe y renderice el nuevo componente `Home` en lugar de `Library`. La ruta `/` ahora muestra la landing page.

### Step 3 — Crear componente `Home`

Crear `src/components/Home.tsx` como Client Component (`"use client"`) con:

- Hook `useReveal()` — IntersectionObserver que agrega clase `.in` a elementos con clase `.reveal` al entrar al viewport.
- `FloatingSilhouettes()` — 8 SVGs de pixel art decorativos con animación `float`, posicionados absolutamente en el hero.
- `FeatureIcon({ kind })` — Íconos pixel SVG para GAMEPAD, FREE, TROPHY, ROCKET (4 casos).
- `MiniCard({ game, onClick })` — Tarjeta compacta con cover art y meta (título, categoría).
- `Home({ })` — Renderiza las 6 secciones:
  1. **Hero** — Siluetas flotantes, eyebrow "INSERTA UNA MONEDA", título en 3 líneas ("EL ARCADE / CLÁSICO ESTÁ / DE VUELTA"), subtítulo, CTAs ("EXPLORAR JUEGOS" → `/biblioteca`, "CREAR CUENTA" → `/auth`), indicador "DESLIZA".

  2. **¿Por qué Arcade Vault?** — Kicker `// 01`, título de sección, 4 feature cards (JUEGOS CLÁSICOS, 100% GRATIS, LADDER BOARDS, SIEMPRE CRECIENDO) con íconos y colores neón (cyan, yellow, magenta, green).

  3. **Juegos Disponibles Ahora** — Kicker `// 02`, título de sección, rail de `MiniCard` con los primeros 6 juegos de `GAMES` (importados de `src/data/games.ts`), botón "VER TODOS LOS JUEGOS" → `/biblioteca`.

  4. **Stats** — 3 bloques: "12+ JUEGOS", "MILES DE PARTIDAS", "GLOBAL RANKING" con números neón.

  5. **Actividad en Vivo** — Kicker `// 03`, dos columnas: ticker de últimas puntuaciones (7 entradas mock con jugador, juego, puntuación, tiempo relativo) y top 5 jugadores del día con barras de progreso. Botón "VER SALÓN" → `/salon`.

  6. **Precios** — Kicker `// 04`, título "PRECIOS", card de "JUGADOR VAULT — $0 / SIEMPRE" con lista de beneficios, botón "EMPEZAR GRATIS", FAQ (3 preguntas), y stamp "FREE PLAY".

  7. **CTA Final** — Título "¿LISTO PARA JUGAR?", botón "INSERTAR MONEDA" → `/biblioteca`, tagline.

### Step 4 — Actualizar `Nav` con ruta Biblioteca

Modificar `src/components/Nav.tsx`:

- Agregar enlace "Biblioteca" entre "Inicio" y "Salón de la Fama" en los links de escritorio y en el panel móvil.
- Actualizar `isActive()`: "Inicio" activo solo en `/`; "Biblioteca" activo en `/biblioteca` y rutas hijas (`/juego/[id]`, `/jugar/[id]`).
- El resto del Nav (logo, créditos, auth, hamburger) no cambia.

### Step 5 — Agregar estilos de la Home a `globals.css`

Agregar al final de `app/globals.css` los estilos para las nuevas secciones (~150 líneas):

- `.home`, `.home-hero`, `.home-hero-inner`, `.hero-eyebrow`, `.home-title`, `.home-sub`, `.home-ctas`, `.hero-scroll`
- `.home-silos`, `.silo`, `@keyframes float`
- `.home-section`, `.section-head`, `.kicker`, `.section-title`, `.section-rule`
- `.feature-grid`, `.feature-card` (con variantes `.cyan`, `.magenta`, `.yellow`, `.green`)
- `.mini-rail`, `.mini-card`, `.mini-cover`, `.mini-meta`
- `.home-stats`, `.stats-inner`, `.stat-block`, `.stat-n`, `.stat-u`, `.stat-s`
- `.activity-grid`, `.activity-card`, `.ac-head`, `.ticker`, `.tick-row`
- `.top-list`, `.top-row`, `.tp-rk`, `.tp-bar`, `.tp-fill`, `.tp-p`, `.tp-s`
- `.pricing-grid`, `.price-card`, `.pc-*`, `.pricing-faq`, `.faq-item`
- `.home-final`, `.final-title`, `.final-cta`, `.final-tag`
- `.reveal`, `.reveal.in`
- `@keyframes bounce`

Todos los estilos siguen las convenciones del template: variables CSS del tema (`--cyan`, `--magenta`, `--yellow`, `--green`, `--pixel`, `--mono`), clases utilitarias Tailwind para layout/espaciado, y custom properties para lo que Tailwind no expresa (animaciones, pseudo-elementos, gradientes complejos).

---

## Acceptance criteria

- [ ] La ruta `/` muestra la nueva Home page con sus 6 secciones (Hero, ¿Por qué?, Juegos, Stats, Actividad, Precios) y CTA Final.
- [ ] La ruta `/biblioteca` muestra el Library con el grid de juegos, buscador, y filtros exactamente como funcionaba antes en `/`.
- [ ] El Navbar tiene el enlace "Biblioteca" entre "Inicio" y "Salón de la Fama".
- [ ] El enlace "Inicio" del Nav está activo (cyan glow) solo en `/`.
- [ ] El enlace "Biblioteca" del Nav está activo en `/biblioteca`, `/juego/[id]`, y `/jugar/[id]`.
- [ ] El menú móvil (hamburger) incluye el enlace "Biblioteca".
- [ ] Los botones "EXPLORAR JUEGOS" y "VER TODOS LOS JUEGOS" y "INSERTAR MONEDA" del Home navegan a `/biblioteca`.
- [ ] El botón "CREAR CUENTA" y "EMPEZAR GRATIS" navegan a `/auth`.
- [ ] El botón "VER SALÓN" navega a `/salon`.
- [ ] El Hero muestra 8 siluetas flotantes (SVG pixel art) animadas con float.
- [ ] Las secciones con clase `.reveal` se animan al entrar al viewport (IntersectionObserver).
- [ ] La sección "Juegos Disponibles Ahora" muestra las primeras 6 `MiniCard` usando datos de `GAMES` desde `src/data/games.ts`.
- [ ] Cada `MiniCard` navega a `/juego/[id]` al hacer clic.
- [ ] Las 4 feature cards tienen íconos pixel SVG y colores neón distintos (cyan, yellow, magenta, green).
- [ ] El ticker de actividad muestra 7 entradas mock con jugador, juego, puntuación, y tiempo relativo.
- [ ] El top jugadores muestra 5 entradas con barras de progreso.
- [ ] La sección Precios muestra el plan "JUGADOR VAULT — $0 / SIEMPRE" con 6 beneficios y FAQ de 3 preguntas.
- [ ] La Home es responsive: features 2 columnas en tablet, 1 en móvil; mini-rail 3 columnas en tablet, 2 en móvil; stats 1 columna en móvil.
- [ ] El build de producción (`npm run build`) completa sin errores.
- [ ] El resto de las pantallas existentes (`/juego/[id]`, `/jugar/[id]`, `/auth`, `/salon`) siguen funcionando sin cambios.

---

## Decisions

- **Sí:** Home como Client Component (`"use client"`). Necesita estado para IntersectionObserver (reveal), y aunque los datos son estáticos, el hook `useReveal` requiere efectos del lado cliente.
- **No:** Home como Server Component. Perdería las animaciones de reveal, que son parte esencial del diseño del template.
- **Sí:** Mover Library a `/biblioteca` y liberar `/` para la Home. Sigue la arquitectura de rutas que el template original espera (`home`, `biblioteca`, `salon`, `about`, `auth`) y separa conceptos: landing page vs. catálogo de juegos.
- **No:** Mantener Library en `/` y poner Home en otra ruta. `/` es la cara del sitio; la landing page de conversión debe estar ahí.
- **Sí:** Datos mock hardcodeados para actividad en vivo y precios. Son secciones cosméticas de la landing page. No hay backend ni persistencia real aún. Cuando exista una API, se reemplazan.
- **No:** Crear `src/data/activity.ts`. Son 7 entradas de ticker y 5 de top jugadores; un archivo separado para datos que solo usa un componente es sobre-ingeniería.
- **Sí:** Estilos de la Home en `globals.css`. Las animaciones (float, bounce), gradientes complejos, pseudo-elementos y selectores anidados superan lo que Tailwind v4 expresa con utilidades. Se agregan al final del archivo existente, siguiendo la misma convención que SPEC 01.
- **No:** CSS Modules o archivos `.module.css` por sección. Un solo bloque en `globals.css` es más simple, no hay colisiones de nombres porque los selectores son específicos (`.home-*`, `.feature-*`, etc.), y mantiene consistencia con los ~900 líneas de estilos custom que ya existen.
- **Sí:** Reutilizar `GAMES` de `src/data/games.ts` para las MiniCard. Evita duplicar datos y asegura que si se agregan juegos en el futuro, la Home los refleje automáticamente.
- **Sí:** `MiniCard` y `FeatureIcon` como funciones internas dentro de `Home.tsx` (no exportadas). Solo las usa la Home page. Si en el futuro otro componente las necesita, se extraen.
- **No:** Crear archivos separados para `MiniCard.tsx` y `FeatureIcon.tsx`. Son componentes pequeños (~15-30 líneas cada uno) acoplados al contexto de la Home. Extraerlos ahora sería prematuro.

---

## Risks

| Risk                                                                                                                                                                                | Mitigation                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Las clases CSS de la Home (`.home-hero`, `.feature-card`, etc.) pueden colisionar con estilos existentes en `globals.css`                                                           | Usar el prefijo `home-` para todas las clases nuevas y agregarlas al final del archivo. Verificar visualmente las 5 pantallas existentes antes de commit.                                      |
| Mover Library de `/` a `/biblioteca` puede romper redirecciones implícitas en otros componentes (ej. botones "VOLVER AL VAULT" en GameOverModal, "Jugar como invitado" en AuthForm) | Revisar todos los componentes existentes que navegan a `/` y verificar si deben apuntar a `/` (Home) o `/biblioteca` (catálogo). El botón "VOLVER AL VAULT" debe ir a `/`, no a `/biblioteca`. |
| `IntersectionObserver` no disponible en navegadores muy antiguos (IE, Opera Mini)                                                                                                   | El observer está envuelto en un efecto que no falla si no existe. Las secciones se muestran sin animación — es una degradación aceptable.                                                      |
| El Nav actualizado con nueva ruta activa (`/biblioteca`) agrega un enlace más que podría desbordar en tablets pequeñas                                                              | El Nav existente ya maneja overflow con el menú hamburger en ≤840px. El enlace extra no cambia el breakpoint.                                                                                  |

---

## What is **not** in this spec

- Página About (`/about`) y formulario de contacto.
- Conexión del ticker de actividad con datos reales.
- Modificación del componente `Library` o `GameCard`.
- Nuevos juegos o cambios en `src/data/games.ts`.
- Backend o API para actividad en tiempo real.
