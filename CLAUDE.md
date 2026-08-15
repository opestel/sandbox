# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A minimal Node.js + TypeScript starter (ES modules, `NodeNext` resolution). `src/index.ts` exports `greet`; `src/cli.ts` is a `commander`-based CLI (bin name `sandbox`) that wraps it, taking an optional `[name]` argument and defaulting to `"World"`.

## Commands

- `npm install` — install dependencies
- `npm run build` — type-compile `src/` to `dist/` via `tsc`
- `npm run typecheck` — type-check only, no emit
- `npm run dev` — run `src/index.ts` directly with `tsx`
- `npm run cli` — run the CLI directly with `tsx` (e.g. `npm run cli -- Ada`); after `npm run build`, the built CLI is also runnable as `node dist/cli.js` or via the `sandbox` bin
- `npm run lint` — ESLint (flat config in `eslint.config.js`, `@eslint/js` + `typescript-eslint` recommended rules)
- `npm test` — run the full Vitest suite once
- `npm run test:watch` — Vitest in watch mode
- Run a single test file: `npx vitest run src/index.test.ts`
- Run a single test by name: `npx vitest run -t "test name"`

## Architecture notes

The codebase is still small — there is no established architecture beyond a library entry point (`src/index.ts`) plus a thin CLI wrapper (`src/cli.ts`) that stays free of business logic. As real modules are added under `src/`, prefer colocating each module's test as `*.test.ts` next to the source file (see `src/index.test.ts`). `src/cli.test.ts` is an integration test that shells out to `tsx src/cli.ts` via `execFileSync` and asserts on stdout — follow that pattern for testing future CLI commands rather than unit-testing `commander` wiring directly. Update this file with real build/architecture guidance once the project takes shape.
