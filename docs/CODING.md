# Coding Overview

This document provides a high-level overview of the coding standards and patterns used in Black Sheep.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe (Checkout + Webhooks)
- **Animations**: Framer Motion
- **State Management**: Zustand (for client state), SWR (for data fetching)

## Directory Structure

- `src/app`: App Router pages and API routes.
- `src/components`: Reusable UI components.
- `src/hooks`: Custom React hooks.
- `src/libs`: Shared library logic (Supabase clients, utility functions).
- `src/providers`: React context providers (Auth, Supabase, Modals).
- `src/types`: TypeScript type definitions.
- `supabase/`: SQL migration files and schema definitions.

## Key Patterns

- **Server vs. Client Components**: Use Server Components for data fetching where possible. Use `"use client"` only when React hooks or browser APIs are needed.
- **API Routes**: Business logic that requires server-side security (like creating vents) should be handled in `src/app/api/`.
- **Responsive Design**: Mobile-first approach using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).
- **Security**: Always enforce Row Level Security (RLS) in Supabase. Never expose sensitive service role keys on the client.
