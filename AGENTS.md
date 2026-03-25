# Team-Coordinator Agent

This repository uses AI help to implement features and fix issues across multiple development teams. Use this file as the default operating guide for the AI “agent” working in this codebase.

## Team Map (what the agent should do)
- **Frontend / UI Engineers**: implement UI/UX changes in `src/components/` and `src/app/*` (client components), keep logic readable, maintain Tailwind/TwMerge usage, and ensure UX is consistent.
- **Backend / Supabase Engineers**: implement data access and API routes (e.g. `src/app/api/*`, RLS assumptions, server-side logic), keep database logic out of UI components, and provide typed results.
- **UI/UX Designers**: request and verify visual consistency (icons/emotions/colors, spacing, accessibility), and confirm the UI matches the intended mental model.
- **QA / Debugging**: reproduce issues, validate fixes in development and production builds, and ensure regression coverage for the fixed flows.
- **Tech Lead / Maintainers**: enforce “one-person codebase” consistency, refactor unsafe patterns (e.g. `any`, illegal hook usage), and keep project structure modular.

## How the agent decides priority
1. Blockers first: TypeScript/build failures, module resolution errors, illegal hook usage, and failing lint/type checks.
2. User-facing correctness next: auth redirects, routing/guard behavior, permissions, data correctness.
3. Consistency + architecture: modularization, separating backend from frontend, and strengthening types.
4. Presentation polish last: emotion labels, map bubble rendering, styling tweaks.

## Default implementation rules
- Avoid `any` and prefer explicit TypeScript interfaces/types.
- Keep hooks usage valid (React rules of hooks).
- Separate backend logic/data access from UI rendering. API routes should not be “inlined” into UI components.
- When changing behavior or user flow, update `docs/TODO.md` task status.

## Response format (when you finish a task)
Tell the user:
1. What you changed (brief).
2. Which `docs/TODO.md` items were updated.
3. How to verify (build/lint/dev route).

