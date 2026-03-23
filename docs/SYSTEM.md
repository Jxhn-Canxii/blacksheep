# System Overview

This document describes the high-level architecture and data flow of the Black Sheep platform.

## Architecture

Black Sheep is a modern web application built on a serverless architecture.

- **Frontend**: Next.js hosted on Vercel (or similar), utilizing Server-Side Rendering (SSR) and Static Site Generation (SSG) for optimal performance.
- **Backend-as-a-Service (BaaS)**: Supabase provides authentication, a PostgreSQL database, and real-time capabilities.
- **Real-time Engine**: Supabase Realtime is used for instant updates in chat, notifications, and the global vent feed.

## Data Flow

1. **Authentication**: Handled via Supabase Auth. Users can sign in with Email/Password or third-party providers (Google, Discord, GitHub).
2. **Vent Submission**: 
   - User submits a vent via `VentForm`.
   - The client calls `/api/vents` (POST).
   - The server validates the request and inserts the data into the `vents` table in Supabase.
   - Supabase Realtime broadcasts the new vent to all connected clients.
3. **Emotional Ledger**:
   - Periodic check-ins are requested by the Black Sheep Assistant.
   - User responses are saved to the `emotional_ledger` table.
   - Stats are aggregated on the `Profile/Ledger` page using a combination of ledger entries and user vents.
4. **Offline Mode**:
   - The `ConnectionStatus` component monitors network state.
   - Offline vents are cached in `localStorage`.
   - Upon reconnection, cached signals are automatically synchronized via the API.
5. **Monetization & Verification**:
   - Users can upgrade to a "Premium" plan via Stripe Checkout.
   - Webhooks (`/api/webhooks/stripe`) handle subscription events to toggle the `is_verified` status in Supabase.
   - Verified status grants a badge visible on vents and replies, with user-controlled visibility.

## Security

- **RLS (Row Level Security)**: Every table in Supabase has strict RLS policies to ensure users can only access their own data or public data as intended.
- **Environment Variables**: Sensitive keys (Supabase Service Role, Stripe Secret) are stored securely and never exposed to the client-side bundle.
- **Feature Flags**: Critical systems like the Verified Plan can be toggled globally via the `NEXT_PUBLIC_ENABLE_VERIFIED_PLAN` environment variable.
