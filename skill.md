# BlogiFy – Repository Instructions for Lovable

## Project overview

**BlogiFy** is a blog engine / blogging platform built with React, TypeScript, TanStack Router, and Supabase. This repository is connected to [Lovable](https://lovable.dev).

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, TypeScript, Tailwind CSS |
| Routing | TanStack Router / TanStack Start |
| State & data | TanStack Query, Supabase JS |
| Database | Supabase (PostgreSQL + PLpgSQL functions) |
| Styling | CSS / Tailwind CSS v4 |
| Build | Vite, Bun |

The primary languages in use are **TypeScript**, **CSS**, **JavaScript**, and **PLpgSQL** (Supabase migrations/functions).

## Safe-working rules

> **This repository syncs with Lovable. Violating these rules can corrupt the project history on Lovable's side.**

1. **Never force-push** (`git push --force` or `--force-with-lease`) to any branch that has already been pushed.
2. **Never rewrite published git history** – no `git rebase`, `git commit --amend`, or interactive squash on commits that are already pushed.
3. **Avoid destructive changes** to the database schema or Supabase migrations without a matching rollback migration.
4. Keep the connected branch in a **working state** at all times – every commit that is pushed should leave the app buildable and functional.

## Development guidelines

- Make **small, focused changes** that address one concern at a time.
- Do not modify unrelated files unless required by the change.
- Run `bun run lint` before committing to catch TypeScript and ESLint errors early.
- Keep Supabase migrations additive where possible (add columns/tables rather than drop or rename them destructively).
- Follow the existing component structure under `src/` and reuse shadcn/ui primitives from `src/components/ui/`.
