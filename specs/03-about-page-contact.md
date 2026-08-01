# SPEC 03 — About page y envío de correo con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-08-01
> **Objective:** Implementar la página About (`/about`) con diseño retro-neón siguiendo el template de referencia, incluyendo formulario de contacto funcional que envía correos reales mediante Resend vía Server Action, con cooldown de 60 segundos entre envíos.

---

## Scope

**In:**

- Nueva ruta `/about` con Server Component como page wrapper y Client Component para la interactividad
- Sección "Acerca de" con: título neón "ACERCA DE ARCADE VAULT", misión, y 3 highlights (Hecho con ❤️, Juegos HTML5, Proyecto en crecimiento) con íconos pixel SVG y colores magenta/cyan/green
- Divisor animado con barras laterales y dots de colores parpadeantes entre secciones
- Sección "Contáctanos" con: título, subtítulo, tips (respuesta 24-48h, sugerencias bienvenidas, sin spam), y formulario (nombre, correo, mensaje)
- Validación cliente: campos requeridos, shake animation si están vacíos
- Envío real de correo mediante **Resend** vía **Server Action** (`app/actions/contact.ts`)
- Server Action recibe `{ name, email, message }`, valida en servidor, llama a Resend, y retorna `{ success: true }` o `{ error: string }`
- Animación "terminal success" al enviar exitosamente, con opción "ENVIAR OTRO MENSAJE"
- Animación "terminal error" si falla el envío, con opción "REINTENTAR"
- Spinner/loading state en el botón mientras se envía
- Cooldown de 60 segundos entre envíos (trackeado con cookie `contact_cooldown`)
- Estilos CSS para la página About en `globals.css` (ya incluidos en el template de referencia: `.about`, `.about-hero`, `.highlight-row`, `.about-divider`, `.contact-grid`, `.contact-form`, `.terminal-success`, etc.)
- Tipos TypeScript para el formulario y la respuesta del Server Action

**Out of scope (for future specs):**

- Integración con base de datos para guardar mensajes de contacto
- Panel administrativo para leer/responder mensajes
- Captcha o verificación anti-bot (más allá del cooldown)
- Notificaciones en tiempo real (WebSocket/SSE) de nuevos mensajes
- Tests automatizados
- Templates de correo HTML complejos (se usa texto plano con formato básico)

---

## Data model

### Server Action — `app/actions/contact.ts`

```ts
"use server";

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactResult {
  success: boolean;
  error?: string;
}

export async function sendContactEmail(
  data: ContactFormData,
): Promise<ContactResult> {
  // 1. Validar campos requeridos en servidor
  // 2. Llamar a Resend API con la key RESEND_API_KEY
  // 3. Retornar { success: true } o { error: "mensaje" }
}
```

### Estado del formulario (solo cliente, en `AboutContact.tsx`)

```ts
// Estado local del Client Component — no hay modelo persistente
type FormState = "idle" | "loading" | "success" | "error";

interface FormData {
  name: string;
  email: string;
  message: string;
}
```

### Cookie de cooldown

- **Nombre:** `contact_cooldown`
- **Valor:** timestamp Unix (ms) del último envío exitoso
- **Duración:** 60 segundos
- **Lectura:** En la Server Action antes de procesar el envío
- **Escritura:** En la response de la Server Action vía `cookies().set()`

### Datos estáticos

Los highlights y tips son literales hardcodeados dentro del componente `About`, sin capa de datos separada. Son texto e íconos que no cambian.

---

## Implementation plan

### Step 1 — Instalar Resend y configurar variables de entorno

Instalar el paquete `resend` desde npm. Crear archivo `.env.example` con la variable `RESEND_API_KEY` documentada. El `.env.local` lo configura el usuario después con su key real.

### Step 2 — Crear Server Action para envío de correo

Crear `app/actions/contact.ts`:

- Exportar interfaces `ContactFormData` y `ContactResult`.
- Exportar función `sendContactEmail` con `"use server"`.
- Validar server-side que `name`, `email`, y `message` no estén vacíos.
- Leer cookie `contact_cooldown`: si existe y no han pasado 60s, retornar error `"Espera N segundos antes de enviar otro mensaje."`.
- Si validación pasa, instanciar Resend con `RESEND_API_KEY` y llamar `resend.emails.send()` con:
  - `from`: `"Arcade Vault <noreply@arcadevault.com>"` (o dominio configurable vía env)
  - `to`: `"arsabe75@gmail.com"`
  - `subject`: `"Nuevo mensaje de contacto de {name}"`
  - `text`: cuerpo con name, email, message, y fecha
- Si Resend responde ok: setear cookie `contact_cooldown` con timestamp actual y retornar `{ success: true }`.
- Si Resend falla: retornar `{ error: "No se pudo enviar el mensaje. Intenta de nuevo." }`.
- Envolver todo en try/catch.

### Step 3 — Crear la ruta `/about`

Crear `app/about/page.tsx` como Server Component que importa y renderiza el Client Component `About`. La página es server por defecto; solo el formulario necesita cliente.

### Step 4 — Crear componente `About` y subcomponentes

Crear `src/components/About.tsx` como Client Component (`"use client"`) con:

- **`HighlightIcon({ kind })`** — íconos pixel SVG para HEART (corazón), BROWSER (navegador), PLANT (planta). Replicación exacta de los SVGs del template, usando rects con colores neón.
- **`AboutHero()`** — sección "Acerca de" con kicker "▸ ACERCA DE", título neón, párrafo de misión, y 3 highlights con íconos y texto.
- **`Divider()`** — divisor animado con barras horizontales y dots de colores (`pxblink`).
- **`AboutContact()`** — sección "Contáctanos" con formulario completo:
  - Estado: `idle | loading | success | error`
  - Validación cliente: campos vacíos → `shake` animation
  - Submit → `setFormState("loading")` → llamar Server Action `sendContactEmail`
  - Success → terminal verde con líneas de log y mensaje personalizado
  - Error → terminal rojo con borde y glow magenta, mensaje de error y botón "REINTENTAR"
  - Botón "ENVIAR OTRO MENSAJE" resetea el formulario
  - Reintentar en estado error limpia el error y vuelve a `idle`

### Step 5 — Agregar estilos de About a `globals.css`

Verificar que los estilos de la página About ya existen en `globals.css` (fueron agregados en SPEC 01/02). Si falta algún estilo específico de los terminals o ajustes menores, agregarlos. Los estilos principales ya están: `.about`, `.about-hero`, `.highlight-row`, `.about-divider`, `.contact-grid`, `.contact-form`, `.terminal-success`.

Agregar estilos nuevos para:

- `.terminal-error` — variante del terminal con borde magenta en lugar de verde
- Animación `shake` en el formulario (ya existe en el CSS actual)
- Spinner en botón durante loading

### Step 6 — Integrar y verificar

- Verificar que el Nav ya tiene el enlace "Acerca de" funcional (apunta a `/about`).
- Verificar que la navegación funciona desde Home, Biblioteca, y resto de páginas.
- Probar flujo completo: formulario vacío → shake, formulario lleno → loading → terminal success, doble envío rápido → error cooldown, fallo de API → terminal error → reintentar.
- Verificar responsive en móvil, tablet, desktop.
- `npm run build` sin errores.

---

## Acceptance criteria

- [ ] La ruta `/about` carga sin errores y muestra la página About completa.
- [ ] La sección "Acerca de" muestra el kicker "▸ ACERCA DE", el título neón "ACERCA DE ARCADE VAULT", la misión, y los 3 highlights con íconos pixel SVG (corazón magenta, navegador cyan, planta green).
- [ ] El divisor animado entre secciones muestra barras horizontales y dots de colores con animación `pxblink`.
- [ ] La sección "Contáctanos" muestra título, subtítulo, 3 tips con LEDs (verde, amarillo, magenta), y el formulario con campos nombre, correo, mensaje.
- [ ] Enviar el formulario con campos vacíos muestra la animación `shake` y no llama al Server Action.
- [ ] Enviar con todos los campos llenos muestra un estado de loading (spinner o texto "ENVIANDO...") en el botón.
- [ ] Al recibir respuesta exitosa del Server Action, se muestra el terminal success verde con las líneas de log ("Conectando con servidor…", "Validando contenido…", "Transmitiendo paquete…") y el mensaje "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {NOMBRE}."
- [ ] El terminal success tiene el botón "ENVIAR OTRO MENSAJE" que resetea el formulario.
- [ ] Si el Server Action retorna error (incluyendo cooldown), se muestra el terminal error con el mensaje de error y un botón "REINTENTAR".
- [ ] El botón "REINTENTAR" limpia el error y permite editar y reenviar el formulario.
- [ ] Si se intenta enviar dos mensajes en menos de 60 segundos, el segundo intento recibe error de cooldown indicando los segundos restantes.
- [ ] El enlace "Acerca de" en el Nav está activo (cyan glow) cuando se está en `/about`.
- [ ] El enlace "Acerca de" en el menú móvil (hamburger) también está presente y activo en `/about`.
- [ ] La página About es responsive: en móvil los highlights se apilan en 1 columna, el contact-grid se vuelve 1 columna, y el formulario ocupa el ancho completo.
- [ ] El archivo `.env.example` documenta la variable `RESEND_API_KEY`.
- [ ] `npm run build` completa sin errores.

---

## Decisions

- **Sí:** Resend para envío de correos. Es la opción más simple para Next.js: SDK oficial, tipado, y sin configuración de SMTP. El plan gratuito permite 100 emails/día, más que suficiente para un formulario de contacto.
- **No:** Nodemailer con SMTP. Requiere configurar un servidor SMTP (Gmail, SendGrid, etc.), manejar contraseñas de aplicación, y el setup es más frágil.
- **No:** API Route (`/api/contact`). Un endpoint HTTP es innecesario cuando Next.js 16 soporta Server Actions nativas. La Server Action se puede llamar directo desde el Client Component sin fetch, sin CORS, y con tipos compartidos.
- **Sí:** Server Action en `app/actions/contact.ts`. Sigue la convención de Next.js 16 de colocar acciones del servidor cerca de donde se usan. La carpeta `app/actions/` agrupa todas las Server Actions del proyecto.
- **No:** Colocar la Server Action dentro del mismo archivo del componente. Separar la acción permite reutilizarla si en el futuro otro formulario la necesita, y mantiene el componente enfocado en la UI.
- **Sí:** Cookie `contact_cooldown` para rate limiting. Es simple de implementar (nativo de Next.js con `cookies()`), no requiere base de datos, y es suficiente para prevenir abuso básico. No bloquea usuarios legítimos.
- **No:** Rate limiting basado en IP o en memoria del servidor. La IP requeriría middleware adicional y no es confiable detrás de proxies. La memoria del servidor no persiste entre deploys en serverless. La cookie es más simple y directa.
- **No:** Captcha (reCAPTCHA, hCaptcha, Turnstile). Agregaría fricción al usuario, dependencia externa, y complejidad de configuración. El cooldown de 60s + validación server-side cubren el riesgo para un formulario de contacto.
- **Sí:** Terminal visual para success y error, replicando la estética del template. El terminal success es verde (estilo hacker/arcade), el terminal error usa borde y glow magenta para diferenciarlo visualmente. Mantiene la consistencia visual con el resto del sitio.
- **No:** Toast o alert genérico. Rompería la inmersión visual retro-neón que el sitio construye en cada pantalla.
- **Sí:** Componente `About` como Client Component. El formulario necesita estado (form data, loading, success, error) y eventos (onChange, onSubmit). El Server Component padre (`app/about/page.tsx`) se encarga del SEO metadata.
- **No:** Formulario completamente server-rendered sin JS. Perderíamos la validación cliente (shake), el loading state, y la transición fluida a los terminals. La experiencia retro-neón del template requiere interactividad.
- **Sí:** Íconos pixel SVG inline (rects en `<svg>`) como en el template. Son pequeños (~20 líneas cada uno), no requieren assets externos, y se pueden colorear con `currentColor` para heredar el color neón del highlight.
- **No:** Íconos como archivos `.svg` separados o fuentes de íconos. Añadirían requests HTTP o dependencias innecesarias para 3 íconos decorativos.

---

## Risks

| Risk                                                                                                                  | Mitigation                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` no configurada en `.env.local` — la Server Action fallará en cada envío                              | El Server Action envuelve la llamada a Resend en try/catch y retorna error genérico. El terminal error muestra mensaje claro al usuario sin exponer detalles internos. Se documenta en `.env.example`.           |
| La cookie `contact_cooldown` se puede evadir borrando cookies del navegador                                           | Es un riesgo aceptable para un formulario de contacto sin datos sensibles. Para producción con tráfico real se puede agregar rate limiting por IP en el futuro. No está en el scope de este spec.                |
| Resend tiene límite de 100 emails/día en plan gratuito — un abuso podría agotarlo                                     | El cooldown de 60s reduce la tasa a máximo 1,440 emails/día teóricos, pero en la práctica un atacante necesitaría saltarse la cookie y automatizar requests. Se monitoreará cuando el sitio tenga tráfico real.  |
| El dominio `arcadevault.com` puede no estar verificado en Resend — los emails pueden caer en spam o ser rechazados    | Usar un `from` configurable vía variable de entorno `RESEND_FROM_EMAIL`. En desarrollo/test usar el dominio por defecto de Resend (`onboarding@resend.dev`). En producción, verificar el dominio real en Resend. |
| La Server Action y el Client Component comparten interfaces TypeScript — si cambian, puede haber desacople silencioso | Las interfaces `ContactFormData` y `ContactResult` se definen en el archivo de la Server Action (`app/actions/contact.ts`) y se importan desde el componente. Fuente única de verdad.                            |

---

## What is **not** in this spec

- Base de datos para guardar mensajes de contacto.
- Panel administrativo para leer/responder mensajes.
- Captcha o verificación anti-bot avanzada.
- Notificaciones en tiempo real de nuevos mensajes.
- Templates de correo HTML complejos.
- Tests automatizados.
