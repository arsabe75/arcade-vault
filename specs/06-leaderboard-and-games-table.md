# SPEC 06 — Leaderboard en la nube y tabla de juegos

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02, SPEC 04, SPEC 05
> **Date:** 2026-10-17
> **Objective:** Crear el leaderboard real en la nube con Supabase: tablas `games` (catálogo) y `scores` (marcas) con RLS, guardado real desde el `GameOverModal`, y leaderboards reales en el Salón de la Fama, la ficha de juego y las tarjetas de la biblioteca, eliminando los datos falsos generados (`seededScores`).

---

## Scope

**In:**

- Nueva migración `supabase/migrations/20261017000000_create_games_and_scores.sql` aplicada al proyecto remoto `fsdzdezgjnaojchkfqsn`:
  - Tabla `games` — catálogo mínimo: `id text PK`, `title text not null`, `created_at timestamptz default now()`. Sembrada con los 8 juegos actuales de `GAMES`.
  - Tabla `scores` — `id uuid PK default gen_random_uuid()`, `game_id text not null references games(id) on delete cascade`, `initials text not null check (char_length(initials) between 1 and 10)`, `score integer not null check (score >= 0)`, `user_id uuid null` (reservado para el spec futuro de auth), `created_at timestamptz not null default now()`.
  - Índice `scores (game_id, score desc)` para las queries de leaderboard.
  - RLS habilitado en ambas tablas. Políticas anon: SELECT público en `games` y `scores`; INSERT en `scores`. Sin políticas de UPDATE/DELETE (solo el service role puede modificar).
- Nuevo módulo `src/lib/supabase/scores.ts` ("use client") con el tipo `ScoreEntry`, las funciones `fetchTopScores`, `fetchAllBests`, `insertScore`, los hooks `useTopScores` y `useAllBests` (estados `loading`/`error`/`data` + `reload`), y el helper `formatDate` (`DD/MM/YYYY`, `es-ES`).
- `GameOverModal`: guardar con `insertScore` a Supabase (async, con estado `saving`, mensaje de error y reintento). Se elimina el guardado en `localStorage` (`av_scores`).
- `GameDetail`: leaderboard real reutilizando el componente `Leaderboard` (top 10), "Mejor global" real (`rows[0]?.score`, `—` si no hay marcas), estados de carga/error/vacío.
- `HallOfFame`: datos reales por pestaña de juego vía `useTopScores`, sin la fila falsa "TU MEJOR MARCA", con estados de carga/error/vacío.
- `Library` + `GameCard`: "MEJOR PUNTUACIÓN" real — `Library` llama `useAllBests()` una vez y pasa `best` como prop a cada tarjeta; sin datos muestra `—`.
- `src/data/games.ts`: eliminar `seededScores`, el tipo `ScoreRow`, el import de `PLAYERS` y el campo `best` del interface `Game` y de las 8 entradas.
- Eliminar `src/data/players.ts` (queda huérfano).

**Out of scope (for future specs):**

- Autenticación real con Supabase Auth — `user_id` queda `null` hasta ese spec; la fila "TU MEJOR MARCA" real vuelve con la auth.
- Supabase Realtime (los leaderboards cargan al montar y al cambiar de pestaña).
- Generación de tipos con `supabase gen types` — se usa el tipo local `ScoreEntry`.
- Migrar las puntuaciones existentes de `localStorage` (`av_scores`) — hoy nadie las lee; la nube empieza limpia.
- Mover el catálogo completo de juegos a la BD (la tabla `games` es solo id + title para el FK; el front sigue leyendo `GAMES` estático).
- Rate limiting / protección anti-spam del INSERT anónimo (va con la auth o un spec dedicado).
- Hacer dinámico el campo `plays` de las tarjetas/fichas (sigue estático como hasta hoy).
- Tests automatizados.

---

## Data model

### Migración — `supabase/migrations/20261017000000_create_games_and_scores.sql`

```sql
-- Catálogo mínimo de juegos: existe para el FK de scores.
-- El front sigue leyendo src/data/games.ts; mover el catálogo completo a la BD es un spec futuro.
create table public.games (
  id text primary key,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games (id) on delete cascade,
  initials text not null check (char_length(initials) between 1 and 10),
  score integer not null check (score >= 0),
  user_id uuid null, -- reservado para el spec futuro de auth
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games_select_public" on public.games
  for select using (true);

create policy "scores_select_public" on public.scores
  for select using (true);

create policy "scores_insert_public" on public.scores
  for insert with check (true);
-- Sin políticas de update/delete: solo el service role puede modificar filas existentes.

insert into public.games (id, title) values
  ('bloque-buster', 'BLOQUE BUSTER'),
  ('caida', 'CAÍDA'),
  ('serpentina', 'SERPENTINA'),
  ('gloton', 'GLOTÓN'),
  ('invasores', 'INVASORES'),
  ('rocas', 'ROCAS'),
  ('ranaria', 'RANARIA'),
  ('duelo-pixel', 'DUELO PIXEL');
```

Nota: `gen_random_uuid()` funciona sin setup extra porque Supabase habilita `pgcrypto` por defecto en proyectos nuevos.

### Módulo — `src/lib/supabase/scores.ts`

Módulo client ("use client") que centraliza las queries de scores. Lo consumen `GameOverModal`, `GameDetail`, `HallOfFame` y `Library` — así el patrón de estados no se duplica en 4 componentes.

```ts
export interface ScoreEntry {
  id: string;
  game_id: string;
  initials: string;
  score: number;
  user_id: string | null;
  created_at: string;
}

export function formatDate(iso: string): string; // new Date(iso).toLocaleDateString("es-ES") → "DD/MM/YYYY"

export async function fetchTopScores(
  gameId: string,
  limit = 10,
): Promise<ScoreEntry[]>;
// select * from scores where game_id = eq
// order: score desc, created_at asc (desempate: la marca más antigua rankea mejor)
// limit

export async function fetchAllBests(): Promise<Record<string, number>>;
// select game_id, score from scores (sin límite) y reduce client-side al máximo por juego.
// Tabla pequeña en esta fase; si crece, optimizar con vista/RPC en un spec futuro.

export async function insertScore(
  gameId: string,
  initials: string,
  score: number,
): Promise<void>;
// insert con la anon key (RLS permite INSERT público). Lanza excepción si falla.

export function useTopScores(
  gameId: string,
  limit = 10,
): {
  rows: ScoreEntry[] | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
};
// useEffect sobre gameId. Guard contra race conditions al cambiar de pestaña rápido
// (flag de "stale response" ignorado). null = aún cargando.

export function useAllBests(): {
  bests: Record<string, number> | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
};
```

### Cambios por componente

**`GameOverModal.tsx`**

- Estado nuevo: `saving` (boolean) y `error` (boolean), junto al `saved` existente.
- `handleSave` pasa a ser async: valida las iniciales igual que hoy, llama `insertScore(gameId, trimmed, score)`; en éxito `setSaved(true)`; en fallo `setError(true)` y `setSaving(false)` para permitir reintentar con el mismo input.
- Mientras guarda, el botón muestra "GUARDANDO…" y queda deshabilitado.
- En error, línea en magenta "NO SE PUDO GUARDAR — REINTENTA" sobre la fila de input.
- Se elimina todo el código de `localStorage` (`av_scores`). Los botones "JUGAR DE NUEVO" y "VOLVER AL VAULT" siguen siempre disponibles (si el usuario sale sin guardar, la marca se pierde — su elección).

**`Leaderboard.tsx`**

- El prop pasa de `ScoreRow[]` (de `games.ts`) a `ScoreEntry[]` (de `scores.ts`).
- El `rank` se deriva del índice (`i + 1`) y la fecha se muestra con `formatDate(r.created_at)`. El resto del markup no cambia.

**`GameDetail.tsx`**

- Elimina `seededScores` y el `useMemo` de filas. Usa `useTopScores(id)`.
- El `<aside>` reutiliza `<Leaderboard rows={rows} />` (se elimina el markup duplicado inline).
- "Mejor global" de la ficha: `rows?.[0]?.score` formateado; `—` si no hay marcas o mientras carga. La primera fila de la query desc **es** el máximo global (el `limit` no lo afecta), no hace falta query extra.
- Estados: mientras carga, texto "CARGANDO…"; en error, "NO SE PUDO CARGAR EL LEADERBOARD" + botón REINTENTAR (`reload`); con 0 filas, "AÚN NO HAY MARCAS — ¡SÉ EL PRIMERO!".
- Se elimina el uso de `game.best`.

**`HallOfFame.tsx`**

- Elimina `seededScores`, el estado `user`, `youRank`/`youScore` y todo el bloque "▸ TU MEJOR MARCA EN {juego}".
- Usa `useTopScores(tab)` (top 10, unifica el 12 actual del Salón con el 10 de la ficha).
- El `Podium` se renderiza solo si hay al menos 3 marcas; con 1–2 marcas se muestra solo la tabla; con 0, el estado vacío.
- Estados de carga/error/vacío con el mismo patrón y textos que `GameDetail`.

**`Library.tsx` + `GameCard.tsx`**

- `Library` llama `useAllBests()` una vez y pasa `best={bests?.[g.id]}` a cada `GameCard` (evita 8 queries duplicadas).
- `GameCard` recibe la prop opcional `best?: number` y el badge "MEJOR PUNTUACIÓN" muestra `best.toLocaleString("es-ES")` o `—` si es `undefined`. Se elimina el uso de `game.best`.

**`src/data/games.ts` y `src/data/players.ts`**

- Se eliminan `seededScores`, el tipo `ScoreRow` y el import de `PLAYERS`.
- Se elimina el campo `best` del interface `Game` y de las 8 entradas (id, title, short, long, cat, cover, color y plays no cambian).
- Se elimina el archivo `src/data/players.ts` (solo lo usaba `seededScores`).

---

## Implementation plan

### Step 1 — Crear y aplicar la migración

Crear `supabase/migrations/20261017000000_create_games_and_scores.sql` con el SQL del Data model y aplicarla al proyecto remoto con `npx supabase db push`. Si el CLI pide credenciales interactivas, aplicar el mismo SQL con la herramienta MCP `apply_migration`. Verificar con `list_tables` / SQL que `games` y `scores` existen, están sembradas y tienen RLS con las 3 políticas. El front no cambia todavía.

### Step 2 — Crear `src/lib/supabase/scores.ts`

Implementar el módulo del Data model: `ScoreEntry`, `formatDate`, `fetchTopScores`, `fetchAllBests`, `insertScore` y los hooks con guard contra stale responses. El proyecto compila; el módulo aún no se usa.

### Step 3 — Guardado real en `GameOverModal.tsx`

Aplicar los cambios del Data model: insert async con `saving`/`error`, reintento, eliminación de `localStorage`. Verificar jugando una partida de `/jugar/rocas`: guardar funciona, y la fila aparece en la tabla de Supabase (consulta SQL).

### Step 4 — Ficha de juego real (`GameDetail.tsx` + `Leaderboard.tsx`)

Adaptar `Leaderboard` a `ScoreEntry` y refactorizar `GameDetail` para usarlo con datos reales, "Mejor global" real y estados de carga/error/vacío. Verificar en `/juego/rocas` (con datos) y `/juego/bloque-buster` (vacío).

### Step 5 — Salón de la Fama real (`HallOfFame.tsx`)

Aplicar los cambios del Data model: `useTopScores(tab)`, quitar la fila "TU MEJOR MARCA", estados de carga/error/vacío, Podium solo con ≥3 marcas. Verificar `/salon` cambiando de pestaña.

### Step 6 — Tarjetas reales (`Library.tsx` + `GameCard.tsx`)

`useAllBests()` en `Library`, prop `best` en `GameCard`, badge real con `—` cuando no hay datos. Verificar `/` (biblioteca) con y sin marcas guardadas.

### Step 7 — Limpieza de datos falsos

Eliminar `seededScores`, `ScoreRow`, el import de `PLAYERS` y el campo `best` de `src/data/games.ts`; eliminar `src/data/players.ts`. Verificar que no queda ninguna referencia (grep de `seededScores`, `PLAYERS`, `av_scores`, `\.best`).

### Step 8 — Verificar

- `npm run build` sin errores.
- `npm run lint` sin errores nuevos en los archivos de este spec (la salvedad de errores pre-existentes de SPEC 04 sigue aplicando).
- Playtest completo según los acceptance criteria, incluida la verificación entre navegadores (la marca guardada en uno aparece en otro).

---

## Acceptance criteria

- [ ] Existe `supabase/migrations/20261017000000_create_games_and_scores.sql` y está aplicada en el proyecto remoto `fsdzdezgjnaojchkfqsn`.
- [ ] La tabla `games` existe con RLS habilitado y las 8 filas sembradas con los `id`/`title` de `GAMES`.
- [ ] La tabla `scores` existe con RLS habilitado, FK a `games`, checks de `initials` (1–10 caracteres) y `score >= 0`, columna `user_id` nullable e índice en `(game_id, score desc)`.
- [ ] `pg_policies` muestra exactamente 3 políticas: SELECT público en `games`, SELECT público en `scores`, INSERT en `scores` — y ninguna de UPDATE/DELETE para anon.
- [ ] Al pulsar "GUARDAR PUNTUACIÓN" en el `GameOverModal` de `/jugar/rocas`, la fila se inserta en `scores` (verificable con SQL) y el modal muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] Una marca guardada en un navegador aparece en otro navegador/dispositivo (persistencia en la nube, no localStorage).
- [ ] Si el INSERT falla (p. ej. sin red), el modal muestra "NO SE PUDO GUARDAR — REINTENTAR" y permite reintentar; "JUGAR DE NUEVO" y "VOLVER AL VAULT" siguen funcionando.
- [ ] `GameOverModal` ya no escribe en `localStorage` (grep de `av_scores` sin resultados en `src/`).
- [ ] `/juego/rocas` muestra el leaderboard real (top 10) ordenado por puntuación descendente, con iniciales y fechas `DD/MM/YYYY` formateadas en `es-ES`.
- [ ] `/juego/bloque-buster` (sin marcas) muestra "AÚN NO HAY MARCAS — ¡SÉ EL PRIMERO!" en lugar de filas falsas.
- [ ] "Mejor global" de la ficha coincide con la primera fila del leaderboard real y muestra "—" cuando no hay marcas.
- [ ] La tarjeta de cada juego en la biblioteca muestra la mejor puntuación real; "—" si el juego no tiene marcas.
- [ ] `/salon` muestra datos reales por pestaña (top 10), con estados de carga, error y vacío, y sin la fila falsa "TU MEJOR MARCA".
- [ ] El Podium del Salón solo aparece cuando hay al menos 3 marcas.
- [ ] No queda ninguna referencia a `seededScores`, `PLAYERS`, `av_scores` ni `game.best` en `src/`; el archivo `src/data/players.ts` no existe.
- [ ] `npm run build` completa sin errores.
- [ ] `npm run lint` no introduce errores nuevos en los archivos de este spec (salvedad de SPEC 04: los errores pre-existentes de `main` siguen fuera de alcance).
- [ ] Las pantallas no tocadas (`/`, `/biblioteca` salvo la insignia ahora real, `/jugar/[id]` en gameplay, `/auth`, `/about`) se ven y funcionan igual que antes.

---

## Decisions

- **Sí:** Tabla `games` como catálogo mínimo (`id` + `title`) sembrado desde `GAMES`. Su rol hoy es dar integridad referencial al FK de `scores` y dejar el catálogo listo para un futuro.
- **No:** Replicar el catálogo completo (descripciones, portadas, colores, plays) en la BD. El front sigue leyendo `GAMES` estático; mover la fuente única a la BD es un spec propio.
- **Sí:** INSERT directo desde el cliente con la anon key y RLS. Es el patrón estándar de Supabase para high scores anónimos: menos piezas, sin latencia extra.
- **No:** API route / Server Action para el insert. Sin autenticación real no añade seguridad significativa y duplica el camino de datos.
- **Sí:** `user_id uuid null` desde el día uno en `scores`. Cuando llegue la auth (spec futuro) solo hay que rellenarlo, no migrar el schema.
- **Sí:** Eliminar `seededScores` por completo y mostrar estados vacíos reales.
- **No:** Seed de datos demo en `scores` ni fallback a datos generados. Un Salón "lleno" de marcas inventadas contradice el objetivo de este spec; el estado vacío invita a jugar.
- **Sí:** "Mejor global" (ficha) y "MEJOR PUNTUACIÓN" (tarjeta) derivados de `scores`: la primera fila de la query ordenada desc es el máximo global, sin queries extra.
- **No:** Mantener `best` hardcodeado en `games.ts`. Dos fuentes de verdad para el mismo dato termina divergiendo.
- **Sí:** Módulo `src/lib/supabase/scores.ts` con funciones y hooks compartidos. Cuatro componentes consumen el mismo patrón de loading/error/datos; duplicarlo en cada uno es un error clásico.
- **No:** `supabase gen types` en este spec. Con 2 tablas, el tipo local `ScoreEntry` es suficiente; los tipos generados llegan cuando el schema crezca.
- **Sí:** Top 10 por juego en ficha y Salón (unifica el 12 del Salón actual con el 10 de la ficha).
- **Sí:** Desempate por `created_at` ascendente: a igualdad de puntuación, la marca más antigua rankea mejor (la consiguió primero).
- **Sí:** `useAllBests()` en `Library` con una sola query y `best` como prop de `GameCard`. Evita 8 queries duplicadas por página.
- **No:** Realtime en este spec. Cargar al montar y al cambiar de pestaña es suficiente; la suscripción en vivo queda como mejora futura.
- **No:** Migrar `av_scores` de localStorage. Hoy ningún componente lo lee; empezar la nube limpia es más honesto que importar marcas de una sola máquina.
- **No:** Tocar el campo `plays` (sigue estático). El conteo real de partidas es otro spec.

---

## Risks

| Risk                                                                                                             | Mitigation                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INSERT anónimo abierto: cualquiera con la anon key puede insertar marcas sin límite (spam, marcas falsas)        | Aceptado para esta fase (arcade sin auth). Los checks de schema limitan la forma de los datos; la auth y el rate limiting llegan con specs futuros.                           |
| Políticas RLS mal definidas dejan las tablas inaccesibles (queries anon vacías o con error 401)                  | Se verifican las 3 políticas con `pg_policies` en el Step 1 y el criterio correspondiente; los estados de error de la UI hacen visible el fallo en vez de fallar en silencio. |
| `npx supabase db push` pide credenciales interactivas y bloquea el Step 1                                        | Fallback documentado: aplicar el mismo SQL con la herramienta MCP `apply_migration`. El resto de los steps no depende del CLI.                                                |
| Race condition al cambiar rápido de pestaña en `/salon` (respuesta vieja pisa a la nueva)                        | Los hooks ignoran respuestas stale (flag por request en el `useEffect`); solo se aplica el resultado del `gameId` vigente.                                                    |
| El formato de fecha varía por locale del navegador                                                               | Helper único `formatDate` con `toLocaleDateString("es-ES")` usado por `Leaderboard` y `HallOfFame`.                                                                           |
| React StrictMode monta dos veces los efectos de fetch en dev                                                     | Los hooks solo leen (el único write es el INSERT del modal, fuera de efectos). El doble fetch en dev es inofensivo.                                                           |
| Un deploy (p. ej. Vercel) sin `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` falla en runtime | Ya documentado en `.env.example` desde SPEC 04; los estados de error de la UI ("NO SE PUDO CARGAR…") hacen el fallo visible en lugar de mostrar datos rotos.                  |
| `fetchAllBests` lee todas las filas de `scores` y crece sin límite con el uso                                    | Aceptado con la tabla pequeña de esta fase; si el volumen crece, se optimiza con una vista o RPC en un spec futuro (documentado en el Data model).                            |

---

## What is **not** in this spec

- Autenticación real con Supabase Auth (login, registro, OAuth) — `user_id` queda `null`.
- La fila "TU MEJOR MARCA" real en el Salón (vuelve con la auth).
- Supabase Realtime (actualización en vivo del Salón y la ficha).
- Migración de las puntuaciones de `localStorage` (`av_scores`) a la nube.
- Mover el catálogo completo de juegos a la BD (la tabla `games` es solo id + title).
- Generación de tipos TypeScript desde la BD (`supabase gen types`).
- Rate limiting / protección anti-spam del INSERT anónimo.
- Conteo real de partidas (`plays` sigue estático).
- Tests automatizados.
