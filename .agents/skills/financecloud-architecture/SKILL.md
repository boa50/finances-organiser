---
name: financecloud-architecture
description: Use when planning or implementing features in the FinanceCloud React Native/Expo personal finance app, especially when changes cross screens, services, types, API routes, persistence, or shared state.
---

# FinanceCloud Architecture

## Goal

Keep FinanceCloud's existing architecture coherent while implementing features incrementally and with minimal unnecessary changes.

## Project facts

- Cross-platform React Native + Expo application for Web, Android, and iOS.
- Root component `App.tsx` owns the current tab navigation and much of the shared state.
- Shared TypeScript types live in `src/types/index.ts`.
- Client data services live in `src/services/`.
- Serverless API routes live in `/api/`.
- Turso/libSQL is the primary cloud persistence layer.
- `localStorage` is the offline fallback.
- Vercel hosts the web build and `/api/*` serverless functions.
- Platform-specific files use `.native.tsx` and `.web.tsx`.
- Charts use D3 for calculations and `react-native-svg` for rendering.
- Currency conversion uses BRL as the pivot and cached exchange rates.

## Workflow

1. Inspect the relevant existing files before proposing changes.
2. Trace the data flow from screen/component -> service -> API -> database when persistence is involved.
3. Prefer extending existing services and components over creating parallel abstractions.
4. Reuse existing types from `src/types/index.ts`.
5. Keep changes focused on the requested feature.
6. Before changing architecture, explain why the existing pattern is insufficient.
7. For cross-cutting changes, list the files that will change before implementation.
8. After implementation, run the most relevant validation commands available in the repository.

## Constraints

- Do not introduce a new state-management library unless explicitly requested.
- Do not move the app to a new navigation system unless explicitly requested.
- Do not bypass the API layer to access Turso credentials from client code.
- Do not silently change API contracts or database schemas.
- Do not rewrite unrelated files just for stylistic consistency.
- Never expose `TURSO_AUTH_TOKEN` or other secrets to client-side code.

## Preferred implementation style

Favor small, reversible changes. Preserve existing behavior unless the task explicitly changes it.
