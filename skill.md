# Lovable Repository Skill Guide

This repository is connected to [Lovable](https://lovable.dev). Changes pushed to this branch sync into the Lovable editor.

## Safe workflow rules
- Do **not** rewrite published git history (`--force`, rebase/amend/squash of already-pushed commits).
- Keep the branch in a working state at all times (buildable, lintable, and free of obvious runtime breakage).
- Prefer small, focused commits and avoid broad refactors unless explicitly requested.
- Avoid breaking changes to routes, data contracts, or Supabase-facing logic without coordinated updates.

## Project context (quick reference)
- Main stack: **TypeScript**, **JavaScript**, **CSS**, and **PLpgSQL** (Supabase SQL/functions).
- Frontend/build tooling is Vite + TypeScript with scripts in `package.json` (`dev`, `build`, `lint`).
- Backend/data changes are primarily under `supabase/`; validate SQL changes carefully before shipping.
