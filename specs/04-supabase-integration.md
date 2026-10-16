# SPEC 04 — Integración de Supabase en Next.js

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02, SPEC 03
> **Date:** 2026-10-15
> **Objective:** Configurar la integración de Supabase en la aplicación: instalar los paquetes `@supabase/supabase-js` y `@supabase/ssr`, crear los clientes de navegador y de servidor, documentar las variables de entorno, e inicializar Supabase CLI con su carpeta de migraciones, sin cambios visibles en la UI.

---

## Scope

**In:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr` como dependencies
- Instalar `supabase` (CLI) como devDependency de npm — no se instala globalmente
- Obtener la URL del proyecto y la anon key del proyecto Supabase `fsdzdezgjnaojchkfqsn` (ya configurado en `.mcp.json`) y añadirlas a `.env` como `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Documentar ambas variables en `.env.example`
- Crear `src/lib/supabase/client.ts` — browser client con `createBrowserClient` y patrón singleton
- Crear `src/lib/supabase/server.ts` — server client con `createServerClient` y `cookies()` (async en Next.js 16)
- Inicializar Supabase CLI en el proyecto: `supabase init` → `supabase/config.toml` y `supabase/migrations/` (vacía por ahora)
- Vincular el proyecto local al remoto con `supabase link --project-ref fsdzdezgjnaojchkfqsn` usando `SUPABASE_DB_PASSWORD` (ya en `.env`)
- Revisar `.gitignore` tras el init para asegurar que los secretos y `.env` siguen excluidos

**Out of scope (for future specs):**

- Autenticación real con Supabase Auth (login, registro, Google OAuth) — va en un spec futuro
- Creación de tablas, políticas RLS, o cualquier cambio de schema en la base de datos — la carpeta `supabase/migrations/` queda vacía y lista
- High scores en la nube y Salón de la Fama con datos reales
- Migración o descarte de los datos actuales de `localStorage` (`av_user`, `av_scores`)
- Decisión sobre el modo "JUGAR COMO INVITADO"
- Generación de tipos TypeScript desde la base de datos (`supabase gen types`)
- Supabase Realtime
- Verificación end-to-end de la conexión desde la app (query de prueba, endpoint `/api/health`) — la conexión real se ejercita cuando existan tablas

---

## Data model

Este spec no introduce estructuras de datos en la base de datos (no se crean tablas). Define dos helpers de cliente:

### Browser client — `src/lib/supabase/client.ts`

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton: evita crear una instancia por render en client components
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
  }
  return client;
}
```

### Server client — `src/lib/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Crear una instancia por request: cookies() es async en Next.js 16
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // setAll solo se usa en Server Actions — fuera del alcance de este spec
        },
      },
    },
  );
}
```

### Variables de entorno

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto (se obtiene con el MCP de Supabase: `get_project_url`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — anon/publishable key (se obtiene con el MCP: `get_publishable_keys`)
- `SUPABASE_DB_PASSWORD` — ya existe en `.env`; la usa `supabase link` para autenticarse

---

## Implementation plan

### Step 1 — Instalar dependencias

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D supabase
```

El sistema sigue compilando; los paquetes aún no se usan.

### Step 2 — Configurar variables de entorno

- Obtener `NEXT_PUBLIC_SUPABASE_URL` y la anon key del proyecto `fsdzdezgjnaojchkfqsn` vía las herramientas del MCP de Supabase (`get_project_url`, `get_publishable_keys`).
- Añadir ambas a `.env` (los valores reales nunca se versionan).
- Añadir a `.env.example` placeholders documentados, manteniendo las variables de Resend existentes:

```
# Supabase project URL and anon key — dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

### Step 3 — Crear browser client `src/lib/supabase/client.ts`

Crear el archivo según el Data model: `createBrowserClient` con patrón singleton. Este cliente se usará desde client components en specs futuros. El proyecto compila sin cambios visibles.

### Step 4 — Crear server client `src/lib/supabase/server.ts`

Crear el archivo según el Data model: `createServerClient` con `await cookies()` (las request APIs son async en Next.js 16). Incluir `getAll()` y un `setAll()` sin-op documentado (solo es necesario para Server Actions con auth, fuera de este spec).

### Step 5 — Inicializar Supabase CLI

Ejecutar `npx supabase init` en la raíz del proyecto. Esto crea `supabase/config.toml` y la carpeta `supabase/migrations/` (vacía). Revisar el `.gitignore` generado/actualizado: `supabase/` no debe ignorar `config.toml` ni `migrations/`, y `.env` debe seguir ignorado.

### Step 6 — Vincular al proyecto remoto

Ejecutar `npx supabase link --project-ref fsdzdezgjnaojchkfqsn` de forma no interactiva usando `SUPABASE_DB_PASSWORD` de `.env`. Si el link requiere un login interactivo que no se puede automatizar, dejar documentado en el output del paso para que el usuario lo ejecute con `! npx supabase link --project-ref fsdzdezgjnaojchkfqsn`. Este paso no bloquea los anteriores.

### Step 7 — Verificar

- `npm run build` sin errores (Turbopack compila los dos archivos de clientes aunque no se importen aún — si no los compila porque no hay imports, verificar tipos con `npx tsc --noEmit`)
- `npm run lint` sin errores
- Confirmar que `npx supabase link` terminó con éxito o quedó documentado como pendiente del usuario

---

## Acceptance criteria

- [ ] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`, y `supabase` en `devDependencies`.
- [ ] `.env` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con los valores reales del proyecto `fsdzdezgjnaojchkfqsn`.
- [ ] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con placeholders, y conserva las variables de Resend.
- [ ] Existe `src/lib/supabase/client.ts` con `createClient()` usando `createBrowserClient` y patrón singleton.
- [ ] Existe `src/lib/supabase/server.ts` con `createClient()` usando `createServerClient` y `await cookies()`.
- [ ] Ambos archivos pasan el type-check estricto de TypeScript.
- [ ] `supabase/config.toml` existe en la raíz (generado por `supabase init`).
- [ ] La carpeta `supabase/migrations/` existe y está vacía.
- [ ] `.gitignore` sigue excluyendo `.env` y no excluye `supabase/config.toml` ni `supabase/migrations/`.
- [ ] `supabase link` se ejecutó con éxito contra `fsdzdezgjnaojchkfqsn`, o quedó documentado como paso pendiente del usuario.
- [ ] `npm run build` completa sin errores.
- [ ] `npm run lint` completa sin errores.
- [ ] La app no tiene cambios visibles ni funcionales: las pantallas existentes (`/`, `/biblioteca`, `/juego/[id]`, `/jugar/[id]`, `/auth`, `/salon`, `/about`) se ven y funcionan igual que antes.
- [ ] No se expone ningún secreto en el cliente ni en el repo: solo la anon key (publishable) está en variables `NEXT_PUBLIC_*`; `SUPABASE_DB_PASSWORD` y cualquier service key quedan fuera del navegador y del control de versiones.

---

## Decisions

- **Sí:** `@supabase/supabase-js` + `@supabase/ssr`. Es el setup oficial de Supabase para Next.js App Router: el cliente de servidor maneja cookies y queda listo para la autenticación del próximo spec sin rehacer nada.
- **No:** Solo `@supabase/supabase-js` (cliente navegador únicamente). Habría que añadir el cliente de servidor cuando llegue la auth, duplicando trabajo.
- **Sí:** Clientes en `src/lib/supabase/`. Sigue la convención del proyecto de código fuente en `src/` (components en `src/components`, datos en `src/data`).
- **Sí:** Patrón singleton en el browser client. Evita instanciar el cliente en cada render de client components.
- **No:** Instalación global del CLI de Supabase (winget/scoop). Un devDependency de npm está versionado en el repo, funciona igual para cualquier colaborador, y se invoca con `npx supabase`.
- **Sí:** Supabase CLI + carpeta `supabase/migrations/` como flujo de migraciones, aunque en este spec no se aplique ninguna. Las migraciones quedan versionadas en el repo y se aplican con `supabase db push`/MCP en specs futuros.
- **No:** Aplicar cambios de schema con el MCP directamente (sin archivos de migración en el repo). El historial de migraciones versionado es más reproducible.
- **No:** Verificación end-to-end de la conexión en este spec (mini tabla de prueba, endpoint `/api/health`, lectura visible en la UI). Se decidió mantener este spec como infraestructura pura; la conexión real se ejercita cuando existan tablas en el spec de high scores.
- **No:** Generar tipos TypeScript desde la BD ahora. Sin tablas, el tipo generado estaría vacío; el script `gen:types` se configura cuando exista schema real.
- **No:** Tocar autenticación, modo invitado, ni `localStorage`. Son decisiones de specs futuros y este spec no modifica ningún flujo existente.

---

## Risks

| Risk                                                                                                                                             | Mitigation                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL` o la anon key no se configuran en `.env` — cualquier llamada futura fallará en runtime con error de "URL is required" | Se documentan en `.env.example` con placeholders y se obtienen vía el MCP de Supabase (fuente única del proyecto `fsdzdezgjnaojchkfqsn`). La validación real ocurre en el spec que ejecute la primera query. |
| Exponer por error la `service_role` key o la contraseña de BD en variables `NEXT_PUBLIC_*`                                                       | Solo se configuran `NEXT_PUBLIC_SUPABASE_URL` y la anon/publishable key. Se revisa `.gitignore` tras `supabase init`. La anon key es pública por diseño; la service key nunca se toca en este spec.          |
| Incompatibilidad de `@supabase/ssr` con Next.js 16 (APIs async como `cookies()`)                                                                 | El server client usa `await cookies()` como exige Next.js 16. Si la versión instalada de `@supabase/ssr` tuviera problemas conocidos, consultar su documentación oficial antes de escribir el código.        |
| `supabase link` falla por login interactivo (requiere access token personal)                                                                     | El paso es independiente de los demás: la integración queda funcional sin el link y el comando queda documentado para que el usuario lo ejecute con `! npx supabase link ...`.                               |
| `supabase init` genera un `.gitignore` que ignora archivos necesarios de `supabase/`                                                             | Se revisa el `.gitignore` resultante y se corrige para mantener versionados `config.toml` y `migrations/`.                                                                                                   |

---

## What is **not** in this spec

- Autenticación real con Supabase Auth (email/contraseña, Google OAuth).
- Creación de tablas, políticas RLS, o cualquier migración de schema.
- High scores en la nube ni Salón de la Fama con datos reales.
- Migración o descarte de los datos de `localStorage` (`av_user`, `av_scores`).
- Decisión sobre el modo "JUGAR COMO INVITADO".
- Generación de tipos TypeScript desde la base de datos.
- Supabase Realtime.
- Verificación end-to-end de la conexión desde la app.
