# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project overview

**Arcade Vault** — a platform for playing online games and competing for the highest scores. Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and TypeScript 5.

Development follows **Spec Driven Design** using `/spec` and `/spec-impl` workflows, based on [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills).

No test runner is configured yet.

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario

## Tech stack & version notes

| Layer        | Version | Notes                                                                                                                                         |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js      | 16.2.10 | App Router only. **Breaking changes vs older Next.js** — always consult `node_modules/next/dist/docs/` before writing route/page/layout code. |
| React        | 19.2.4  | Server Components by default for pages and layouts.                                                                                           |
| Tailwind CSS | v4      | Uses `@import "tailwindcss"` in CSS (not the old `@tailwind base/components/utilities`). PostCSS plugin: `@tailwindcss/postcss`.              |
| TypeScript   | 5       | Strict mode. Path alias `@/*` → project root.                                                                                                 |
| ESLint       | 9       | Flat config (`eslint.config.mjs`) with `eslint-config-next` core-web-vitals + TypeScript rules.                                               |

### Critical Next.js 16 differences

These differ from older Next.js versions commonly found in training data:

- **`params` is a Promise** — always `await` it: `const { slug } = await params`
- **`searchParams` is a Promise** — always `await` it: `const { q } = await searchParams`
- **`PageProps<'/path'>` and `LayoutProps<'/path'>`** are global type helpers (no import needed) that infer params and slots from the route structure.
- **`fetch` requests are NOT cached by default** (the old `cache: 'force-cache'` default is gone). Use the `'use cache'` directive or wrap in `<Suspense>` for streaming.
- **Turbopack is the default bundler** — `next dev` and `next build` use it. To use Webpack: `next dev --webpack`.
- **`next build` no longer runs the linter** — lint separately via `npm run lint`.
- **No `next/lint`** — the CLI uses ESLint directly.

## Architecture

```
app/
├── layout.tsx        # Root layout (<html>, <body>, Geist fonts, global CSS)
├── page.tsx          # Home page (/) — current scaffold from create-next-app
└── globals.css       # Tailwind v4 import + CSS custom properties for theme
```

- **App Router only** — no `pages/` directory.
- **Fonts**: Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`) loaded via `next/font/google`.
- **Dark mode**: Light/dark theme via `prefers-color-scheme` media query in `globals.css`, using CSS custom properties (`--background`, `--foreground`).
- **Styling approach**: Tailwind utility classes + CSS variables for theming. Dark mode variants use `dark:` prefix.

## Spec Driven Development

This project uses a spec-first workflow:

1. `/spec` — define requirements and design before implementation
2. `/spec-impl` — implement according to the spec

Specs and implementation plans should be written before any non-trivial code changes. Refer to the [fernando-skills](https://github.com/Klerith/fernando-skills) repository for the methodology details.
