## Priority Checklist

### Completed (✅)
- [x] Fix auth UX: after successful login, avoid redirecting back to `/login` before landing on the home page.
- [x] Fix auth UX: after successful registration, redirect to the home page.
- [x] Map bubbles: remove the 3-letter emotion text and render an emoji/emotion indicator instead.
- [x] Map vents: colors now match the `VentForm` emotion list.
- [x] Map vents: emotion emoji/emoticons are complete based on the `VentForm` emotions list.
- [x] Inactivity: if the user is inactive for 1 hour, log out (with redirect).
- [x] UI (feeds + groups): add emotion label on vent messages — `EmotionBadge` component wired into `VentFeed`.
- [x] `EmotionBadge` component — created in `src/components/ui/EmotionBadge.tsx` with tests.
- [x] `formatTimeAgo` utility — extracted to `src/utils/time.ts` with tests, used across all chat/feed components.
- [x] `apiLogger` utility — replaced with axios-based `apiGet`/`apiPost`/`apiDelete` in `src/utils/logger.ts`.
- [x] `messagesService` / chat data access extraction — `src/services/messagesService.ts` separates DB logic from UI.
- [x] TypeScript `any` removal / hardening — zero TS errors across all spec files.
- [x] Modularization — `src/enums/emotions.ts` added; duplicate utility cleanup done; enums/utils/services split cleanly.
- [x] Scan all files and fix errors (TypeScript + ESLint) — zero TS errors, zero ESLint errors/warnings.
- [x] Make sure all types are defined in TypeScript (remove implicit/loose typing and replace `any` with proper interfaces).
- [x] Chat page: axios-style console instrumentation via `apiGet`/`apiPost` with backend logic in services.
- [x] Apply the same "separate backend logic + console instrumentation" approach to all similar pages/routes.
- [x] enums for react reaction types for scaling reacts — `src/enums/reactions.ts`.
- [x] Enforce "one-person codebase" style: route groups `(pages)`, components grouped by functionality, broken imports fixed.
- [x] Backend must not be mixed with frontend: API routes use service layer; pages call API via axios.
- [x] Emotion emoji merged into `emotionColors` — single source of truth in `src/libs/emotionConfig.ts`.
- [x] No multi-codepoint emojis — overwhelmed, melancholy, suffocated, tense all use single-codepoint emoji.
- [x] Navigation reordered by importance: Feed → Chat → Signals → Circles → Vent Maps → Ledger → Profiles → Profile.
- [x] blacksheepassistant sometimes interfere with buttons — fixed z-index and pointer-events.
- [x] vent map glowing bubbles around emoji with same emoji colors not showing — fixed via `getEmotionCssColors`.
- [x] when clicking a vent map there's no emotional label — `EmotionBadge` added to map popup.

### Architecture Rules (enforced going forward)
- All Supabase SELECT/INSERT/UPDATE/DELETE must live in `src/services/` (server-side service functions).
- API routes in `src/app/api/` import from services and expose HTTP endpoints.
- Pages and components call API routes via `apiGet`/`apiPost`/`apiDelete` from `src/utils/logger.ts` (axios-style, instrumented).
- No direct Supabase calls in UI components or pages.

### Next Up (⬜)
- [ ] improve spacing styling uniformity for all pages.
- [ ] feed must be one line feed to binge users to doomscroll.
- [ ] improve circles page ui.
- [ ] color branding must fit the blacksheep brand.
- [ ] upload 15 second video like tiktok.
- [] headers fill up 1/4 of space above reduce it.
- [x] select/update/delete/insert must be in services folder → imported by API routes → called via axios in pages/components.
  - `notificationsService` + `/api/notifications` wired; `notifications/page.tsx` uses `apiGet`/`apiPost`.
  - `/api/vents/trending` route added; `TrendingFeelings.tsx` uses `apiGet` (realtime channel kept as push-only exception).

### Low Priority / Backlog
- [ ] create a websocket server (Supabase Realtime already handles this — no action needed).
- [ ] linked signal / reply / resonate button font size inconsistency in VentFeed.
