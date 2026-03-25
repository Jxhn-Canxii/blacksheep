# Architecture Guide

## Data Flow

```
Database (Supabase)
    ↓
Services (src/services/)        ← Supabase queries live HERE only
    ↓
API Routes (src/app/api/)       ← Import from services, expose HTTP endpoints
    ↓
Pages / Components              ← Call API routes via apiGet/apiPost/apiDelete
```

## Rules

1. **No Supabase calls in pages or components.** Ever.
2. **Services** (`src/services/*.ts`) are the only place that imports `createClient` or `SupabaseClient`.
3. **API routes** (`src/app/api/**/route.ts`) import from services and return JSON responses.
4. **Pages and components** use `apiGet`/`apiPost`/`apiDelete` from `src/utils/logger.ts` to call API routes. This also instruments every call with structured console logs.
5. **Realtime subscriptions** (Supabase channels) are the only exception — they stay in components since they are push channels, not data fetches.

---

## Layer Responsibilities

### `src/services/`
- Pure server-side data access
- Accepts typed parameters, returns typed results
- No HTTP, no React, no Next.js
- Uses `createClient()` from `src/libs/supabaseServer.ts`

```ts
// ✅ Correct
export async function fetchMessages(userId: string, limit: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('messages').select('*')...
  if (error) throw error;
  return data;
}
```

### `src/app/api/`
- Thin HTTP layer — validates input, calls service, returns response
- No business logic
- No direct Supabase calls

```ts
// ✅ Correct
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = await fetchMessages(searchParams.get('user_id')!, 20);
  return NextResponse.json(data);
}
```

### `src/app/(pages)/` and `src/components/`
- No Supabase imports
- All data via `apiGet`/`apiPost`/`apiDelete`

```ts
// ✅ Correct
const messages = await apiGet<Message[]>('/api/messages', { params: { user_id } });

// ❌ Wrong
const { data } = await supabase.from('messages').select('*');
```

---

## API Routes Reference

| Route | Methods | Service | Description |
|-------|---------|---------|-------------|
| `/api/follows` | GET, POST | `followsService` | Get following ids / toggle follow |
| `/api/messages` | GET, POST | `messagesService` | Global chat messages |
| `/api/vents` | GET, POST | — | Vents feed |
| `/api/profiles` | GET | `profilesService` | Search/list profiles |
| `/api/profiles/[id]` | GET | `profilesService` | Single profile + vents |
| `/api/groups` | GET, POST | — | List/create groups |
| `/api/groups/[id]/messages` | GET, POST | — | Group chat messages |
| `/api/group-members` | POST | — | Join group |
| `/api/notifications` | GET, PATCH | `notificationsService` | List / mark read |
| `/api/dm` | GET, POST | `dmService` | Direct messages |
| `/api/ledger` | POST | — | Emotional ledger entry |
| `/api/replies` | POST | — | Reply to vent |

---

## Services Reference

| Service | File | Covers |
|---------|------|--------|
| `messagesService` | `src/services/messagesService.ts` | Global chat fetch/send/follows |
| `dmService` | `src/services/dmService.ts` | DMs, friends list, follow status |
| `profilesService` | `src/services/profilesService.ts` | Profile search, single profile |
| `notificationsService` | `src/services/notificationsService.ts` | Fetch/mark notifications |
| `followsService` | `src/services/followsService.ts` | Follow state helpers |
| `api` | `src/services/api.ts` | toggleFollow, toggleReaction (used by API routes) |

---

## Instrumentation

Every API call from the frontend is automatically logged via `apiGet`/`apiPost`/`apiDelete`:

```
[api] { method: 'GET', url: '/api/messages', params: { offset: 0 }, timestamp: '...' }
[api] { method: 'GET', url: '/api/messages', status: 200, durationMs: 42, timestamp: '...' }
```

Errors log at `[api:error]` level with status code and message.

---

## Remaining Work (in progress)

- [ ] `chat/dm/page.tsx` — wire to `/api/dm`
- [ ] `notifications/page.tsx` — wire to `/api/notifications`
- [ ] `profiles/[id]/ProfileClient.tsx` — wire to `/api/profiles/[id]`
- [ ] `GroupChatClient.tsx` — wire remaining group queries to `/api/groups/[id]`
- [ ] `TrendingFeelings.tsx` — wire to `/api/vents`
- [ ] `UserProvider.tsx` — wire presence update to `/api/profiles/me`
