# Optimization Guide

This document covers the optimization strategies implemented in Black Sheep to ensure a fast, responsive user experience.

## Rendering Performance

- **Server-Side Rendering (SSR)**: Critical data (like initial vents) is fetched on the server to reduce Time to First Byte (TTFB).
- **Static Site Generation (SSG)**: Non-dynamic pages are pre-rendered at build time.
- **Dynamic Imports**: Components like the Leaflet Map are dynamically imported with `ssr: false` to avoid bloating the initial server response.

## Data Fetching & Caching

- **SWR (Stale-While-Revalidate)**: Used for real-time client-side updates with built-in caching and revalidation.
- **Next.js `unstable_cache`**: Applied to expensive database queries (e.g., trending feelings) with a revalidation period (e.g., 600 seconds).
- **Parallel Fetching**: Multiple data sources are fetched simultaneously using `Promise.all` to minimize total loading time.

## Network & Connectivity

- **Offline Support**: Vents are cached in `localStorage` when offline and synchronized automatically upon reconnection.
- **Optimized Assets**: CSS and JS bundles are minified and optimized by the Next.js build process.
- **Lazy Loading**: Images and heavy components are loaded only when they enter the viewport.

## Database Optimization

- **Indexing**: Frequent query columns (like `user_id` and `created_at`) are indexed in Supabase for faster signal extraction.
- **Realtime Filters**: Realtime subscriptions are scoped to specific channels or filters where possible to reduce network overhead.
- **Payment Lifecycle**: Stripe Webhooks are processed asynchronously to ensure the user's payment experience is never blocked by database updates.
