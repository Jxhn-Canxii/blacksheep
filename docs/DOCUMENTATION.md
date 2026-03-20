# Black Sheep Documentation

Black Sheep is a premium social venting application built with **Next.js**, **Supabase**, and **Framer Motion**. It allows users to release "stress bubbles" into a global feed and a real-time map.

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components (bubbles, feeds, maps, bars).
- `src/providers`: React Context providers for Supabase Auth, User state, and Modals.
- `src/libs`: Shared utility functions.
- `src/types`: TypeScript definitions, including `types_db.ts` for Supabase schema.
- `supabase`: Database schema and migration scripts.

## Database Schema (Supabase)

The database consists of the following tables:

| Table | Description |
| :--- | :--- |
| `profiles` | User profiles containing usernames and avatars (linked to `auth.users`). |
| `vents` | The primary data model for "bubbles", containing content, emotion, and location (GeoJSON). |
| `replies` | User replies to specific vents. |
| `messages` | Global chat messages. |
| `groups` | Community circles for shared stressors. |
| `group_members` | Join table for users and groups. |

## Key Components

### `VentFeed`
Displays vents as bubbles using `framer-motion` for a floating effect. It listens to Supabase Realtime for new insertions and updates the feed live.

### `Map`
A Leaflet-based component with a custom dark theme. Markers are custom HTML/CSS bubbles that float. It automatically centers on the user's location via browser Geolocation.

### `VentForm`
Allows users to "blow a bubble". It captures the user's current location and sends it to the `vents` table. Premium glassmorphism design.

## Technical Patterns

### Real-time Synchronization
We use Supabase Realtime Channels. For example, in `ChatPage`:
```tsx
const channel = supabase
  .channel("realtime-messages")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, ...);
```
Since Realtime payloads do not include joined data (like the profile's username), we manually fetch the profile after an insertion event.

### Glassmorphism & Aesthetics
Most UI elements use `backdrop-blur` and low-opacity `neutral-800` weights to achieve a premium "glass" look. Consistent use of `emerald-500` as the primary action color.

## Contributing

1. Ensure `supabase` CLI is installed for local development.
2. Update `src/types/types_db.ts` whenever the database schema changes.
3. Use `framer-motion` for any new interactive elements to maintain the "premium" feel.
