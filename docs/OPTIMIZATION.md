# Black Sheep — Performance Optimization Plan

## Summary of Identified Issues & Fixes

After auditing the entire codebase, here are the **high-impact performance optimizations** grouped by category.

---

## 1. 🔴 Redundant Supabase Realtime Channels (Critical)

| Component | Problem | Fix |
|---|---|---|
| [useUnreadCount](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/hooks/useUnreadCount.ts#5-53) | Creates a global `*` listener on `direct_messages` — fires on EVERY DM event app-wide, even irrelevant ones | Filter to `receiver_id=eq.{userId}` and only listen for INSERT |
| [TrendingFeelings](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/TrendingFeelings.tsx#14-129) | Refetches ALL vents on every INSERT even though layout already passes `initialData` | Debounce the refetch; skip if `initialData` was provided for first render |
| [Notifications](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/Notifications.tsx#24-182) | Correctly filtered, but missing cleanup on unmount edge cases | Minor — already okay |
| [VentFeed](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/VentFeed.tsx#675-1048) | 3 separate vent_reactions listeners (INSERT, UPDATE, DELETE) + 1 vent INSERT = 4 channels | Consolidate into a single `*` on `vent_reactions` |
| [dm/page.tsx](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/app/chat/dm/page.tsx) | `dm-inbox-updates` listener on ALL `direct_messages` changes causes full friend refetch every single message | Only refetch on INSERT and only if the message involves the current user |

## 2. 🟡 Unnecessary Re-renders & React Inefficiencies

| Component | Problem | Fix |
|---|---|---|
| [VentFeed](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/VentFeed.tsx#675-1048) | `followingIds.includes(vent.user_id)` in render loop = O(n×m) per frame | Convert `followingIds` and `followerIds` to `Set` objects |
| `VentCard` | Not memoized properly — receives new object references for `toggleReaction`, `toggleFollow`, `setReactionPickerId` | Stabilize callback refs with `useCallback` (already done for some, but `setReactionPickerId` passes raw setter) |
| [Sidebar](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/Sidebar.tsx#24-206) | Missing `Link` import (will cause runtime error!) | Add `import Link from "next/link"` |
| [VentFeed](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/VentFeed.tsx#675-1048) → `emotionOptions` | Recalculates from all vents on every render even when memoized, but the `useMemo` dep is `[vents]` which changes on every realtime event | Already okay, but the filter loop is wasteful — can be maintained incrementally |
| [dm/page.tsx](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/app/chat/dm/page.tsx) | `filteredFriends` and `filteredRequests` recalculate on every keystroke without `useMemo` | Wrap in `useMemo` |

## 3. 🟡 Network Waterfall Optimization

| Location | Problem | Fix |
|---|---|---|
| [VentFeed](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/VentFeed.tsx#675-1048) → `fetchVents` | When `view === "Following"`, does 2 sequential queries (follows → vents) | Use a single RPC or parallel fetch |
| [dm/page.tsx](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/app/chat/dm/page.tsx) | 3 sequential Supabase queries on mount (following → followers → messages) | Already parallel with `Promise.all` — but `messageData` fetch depends on user IDs from first two, so still waterfall-ish. Can optimize by fetching messages in parallel |
| [GroupChatClient](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/app/groups/%5Bid%5D/GroupChatClient.tsx#96-1020) | Fetches group name, membership, and members sequentially | Use `Promise.all` for independent queries |
| [layout.tsx](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/app/layout.tsx) | `force-dynamic` disables all caching for every route | Remove — individual pages can opt in to dynamic as needed. The layout already uses `unstable_cache` for trending data |

## 4. 🟢 Next.js Config Optimizations

| Location | Problem | Fix |
|---|---|---|
| [next.config.ts](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/next.config.ts) | Missing image optimization, missing compression, missing experimental features | Add `compress: true`, font optimization |
| [layout.tsx](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/app/layout.tsx) | `export const dynamic = 'force-dynamic'` on the ROOT layout | Remove — this forces every page to be dynamically rendered, killing SSG benefits |

## 5. 🟢 Component Code Splitting

| Component | Problem | Fix |
|---|---|---|
| [Map.tsx](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/Map.tsx) (15KB) | Leaflet is heavy but loaded eagerly | Already client-side, but should use `dynamic()` import |
| [LandingClient.tsx](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/LandingClient.tsx) (13KB) | Large landing page loaded for all users | Could benefit from `dynamic()` but not critical |
| [Notifications.tsx](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/components/Notifications.tsx) | Loaded in Header for all pages even when dropdown is closed | Lazy load the dropdown content |

---

## Implementation Priority

1. **Fix Sidebar missing `Link` import** (bug fix)
2. **Remove `force-dynamic` from layout** (biggest single win)
3. **Optimize [useUnreadCount](file:///c:/Users/John%20The%20Great/Desktop/Projects/NextJs/blacksheep/src/hooks/useUnreadCount.ts#5-53) realtime filter** (reduces unnecessary DB queries)
4. **Convert `followingIds`/`followerIds` to Sets** (reduces render computation)
5. **Consolidate VentFeed realtime channels** (reduces WebSocket overhead)
6. **Parallelize GroupChatClient queries** (faster page load)
7. **Memoize filtered lists in DM page** (smoother typing)
8. **Debounce TrendingFeelings refetch** (reduces unnecessary queries)
9. **Optimize DM inbox realtime listener** (reduces full refetches)
10. **Add Next.js config optimizations** (smaller bundles, better caching)
