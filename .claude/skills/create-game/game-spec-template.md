# SPEC NN — <TÍTULO DEL JUEGO>

> **Status:** Draft
> **Depends on:** SPEC 05, SPEC 06
> **Date:** YYYY-MM-DD
> **Objective:** Una frase: integrar <JUEGO> en la plataforma como juego real en `/jugar/<id>` (motor TS puro, wrapper, registry, catálogo, portada y leaderboard).

---

## Scope

**In:**

- Motor TS puro `src/games/<id>/engine.ts` (port de `references/started-games/XX-nombre/game.js` | creado desde cero)
- Wrapper `src/components/<Name>Game.tsx`
- [PRIMERA VEZ] `src/games/registry.ts` + refactor de `GamePlayer.tsx`
- Entrada en `src/data/games.ts` y portada `.cover-<slug>` en `globals.css`
- Migración `supabase/migrations/<YYYYMMDDHHMMSS>_add_game_<id>.sql` (fila en `public.games`)

**Out of scope (for future specs):**

- Sonido (WebAudio), controles táctiles, pausa con tecla
- Realtime en el leaderboard, auth (SPEC 06 los difiere)

---

## Data model

- **Contrato**: `GameEngineProps` de `src/games/registry.ts` (import type). Stats del HUD: `score`, `<otras: lives | level | lines | triple>`.
- **Controles**: teclas exactas (p. ej. ←/→ rotan, ↑ propulsa, Espacio dispara).
- **Motor**: estado interno `playing | dead | gameover`, vidas iniciales, constantes (de la referencia, copiadas literalmente, o definidas aquí si es desde cero), canvas 800×600.
- **Callbacks**: `onScore` al sumar, `onLives` al perder vida, `onLevel` al cambiar nivel, `onGameOver` al terminar — solo cuando cambia el valor.

---

## Implementation plan

1. Crear el motor `src/games/<id>/engine.ts` (compila; aún no se usa)
2. Crear el wrapper `src/components/<Name>Game.tsx` (compila; aún no conectado)
3. Registry + GamePlayer (rocas y los simulados quedan intactos)
4. Catálogo `src/data/games.ts` + portada `.cover-<slug>` en `globals.css` (/frontend-design)
5. Migración Supabase `add_game_<id>` (fila en `public.games` verificada por SQL)
6. Verificar: build, lint, playtest y leaderboard end-to-end

---

## Acceptance criteria

- [ ] `/jugar/<id>` renderiza el juego real en canvas dentro del CRT, sin errores en la consola.
- [ ] Los controles funcionan y las teclas del juego no hacen scroll ni re-activan botones del HUD.
- [ ] El HUD de React refleja las stats reales al instante (solo cambios, sin re-render por frame).
- [ ] El botón PAUSA congela y REANUDAR continúa exactamente donde estaba.
- [ ] El botón FIN abre el `GameOverModal` con la puntuación real del momento.
- [ ] Al terminar la partida, el modal aparece con la puntuación final real, sin reinicio con tecla.
- [ ] "GUARDAR PUNTUACIÓN" inserta la fila en `scores` (verificable con SQL) y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] "JUGAR DE NUEVO" inicia una partida limpia; "VOLVER AL VAULT" navega sin listeners residuales.
- [ ] El leaderboard de `/juego/<id>`, la pestaña de `/salon` y la tarjeta de la biblioteca muestran la marca real.
- [ ] `/jugar/rocas` y los juegos simulados se ven y funcionan igual que antes (si hubo refactor).
- [ ] `npm run build` y `npm run lint` sin errores nuevos.

---

## Decisions

- **Sí:** <decisión tomada con justificación breve>
- **No:** <alternativa descartada y por qué>

---

## Risks

(solo si aplica; tabla Risk | Mitigation como en specs/05-06)

---

## What is **not** in this spec

- Sonido (WebAudio) — spec futuro.
- Controles táctiles — spec futuro.
- Supabase Realtime / auth / rate limiting — heredado de SPEC 06.
- Tests automatizados.
