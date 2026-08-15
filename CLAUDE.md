# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A minimal Node.js + TypeScript starter (ES modules, `NodeNext` resolution) with three entry points:

- `src/index.ts` — exports `greet`, the core library function.
- `src/cli.ts` — a `commander`-based CLI (bin name `sandbox`) that wraps `greet`, taking an optional `[name]` argument and defaulting to `"World"`.
- `src/server.ts` — a plain `node:http` server exposing a small web UI: `public/index.html` (+ `app.js`/`style.css`) asks for a first name and calls `GET /api/origin?name=...`, which is handled by `src/nameOrigin.ts` — it looks up the name on Wikipedia's public API (a search for `"<name> given name"`, then an intro extract for the top hit) and returns `{ title, extract, url }` (or `null` if nothing was found). Once a result is shown, the page can translate the extract via `POST /api/translate` (`{ text, targetLang }` → `{ translatedText }`), handled by `src/translate.ts` using the free MyMemory translation API.

## Commands

- `npm install` — install dependencies
- `npm run build` — type-compile `src/` to `dist/` via `tsc`
- `npm run typecheck` — type-check only, no emit
- `npm run dev` — run `src/index.ts` directly with `tsx`
- `npm run cli` — run the CLI directly with `tsx` (e.g. `npm run cli -- Ada`); after `npm run build`, the built CLI is also runnable as `node dist/cli.js` or via the `sandbox` bin
- `npm run web` — start the web server (`tsx src/server.ts`, default `http://localhost:3000`, override with `PORT`); after `npm run build`, run the built version with `node dist/server.js`
- `npm run lint` — ESLint (flat config in `eslint.config.js`, `@eslint/js` + `typescript-eslint` recommended rules); `public/**` is excluded since it's plain browser JS, not part of the TS toolchain
- `npm test` — run the full Vitest suite once
- `npm run test:watch` — Vitest in watch mode
- Run a single test file: `npx vitest run src/index.test.ts`
- Run a single test by name: `npx vitest run -t "test name"`

## Architecture notes

- Each entry point stays thin and delegates to a plain function: `cli.ts` wraps `greet`, `server.ts` wraps `getNameOrigin` (from `nameOrigin.ts`) and `translateText` (from `translate.ts`) behind an HTTP API and a static file server for `public/`. Keep business logic out of the entry-point files themselves.
- `nameOrigin.ts` and `translate.ts` both call real third-party REST APIs via the global `fetch`; their `*.test.ts` files cover them by mocking `globalThis.fetch` (`vi.spyOn`), and `server.test.ts` covers the HTTP layer by `vi.mock`-ing `./nameOrigin.js` and `./translate.js` and hitting a real server bound to an ephemeral port (`server.listen(0)`) — prefer this mock-at-the-boundary pattern over hitting live third-party APIs in tests.
- `translate.ts` chunks input text (splitting on sentence boundaries, ~400 chars/chunk) before calling MyMemory, since its anonymous tier caps request size — long extracts become multiple sequential requests, joined back together.
- `src/cli.test.ts` is a true integration test that shells out to `tsx src/cli.ts` via `execFileSync` and asserts on stdout — follow that pattern for testing future CLI commands rather than unit-testing `commander` wiring directly.
- Prefer colocating each module's test as `*.test.ts` next to the source file.
- Wikipedia's API is not reachable from every network environment (e.g. restrictive sandboxes/CI egress policies) — a `502` from `/api/origin` with a `"Wikipedia search failed"` or `"Wikipedia extract failed"` message usually means the request itself failed, not a bug in the lookup logic.
