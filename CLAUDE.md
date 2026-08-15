# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A minimal Node.js + TypeScript starter (ES modules, `NodeNext` resolution). Currently just a scaffold: `src/index.ts` exports `greet`, with a matching Vitest spec in `src/index.test.ts`.

## Commands

- `npm install` — install dependencies
- `npm run build` — type-compile `src/` to `dist/` via `tsc`
- `npm run typecheck` — type-check only, no emit
- `npm run dev` — run `src/index.ts` directly with `tsx`
- `npm run lint` — ESLint (flat config in `eslint.config.js`, `@eslint/js` + `typescript-eslint` recommended rules)
- `npm test` — run the full Vitest suite once
- `npm run test:watch` — Vitest in watch mode
- Run a single test file: `npx vitest run src/index.test.ts`
- Run a single test by name: `npx vitest run -t "test name"`

## Architecture notes

The codebase is a blank slate — there is no established architecture yet. As real modules are added under `src/`, prefer colocating each module's test as `*.test.ts` next to the source file (the existing `src/index.test.ts` follows this pattern). Update this file with real build/architecture guidance once the project takes shape.
