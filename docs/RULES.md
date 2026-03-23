# Project Rules & Standards

This document outlines the mandatory rules and standards for all contributions to the Black Sheep codebase.

## Coding Rules

1. **Type Safety**: No `any` types allowed unless absolutely necessary for external library compatibility. Always define interfaces/types in `src/types/`.
2. **Component Structure**: 
   - Use functional components with arrow functions.
   - Keep components small and focused (Single Responsibility Principle).
   - Use `twMerge` and `clsx` for dynamic Tailwind classes.
3. **Naming Conventions**:
   - Files: PascalCase for components (`VentCard.tsx`), camelCase for hooks and libs (`useUser.ts`).
   - Variables/Functions: camelCase.
   - Database Tables: snake_case (`emotional_ledger`).
4. **Imports**: 
   - Use absolute paths with the `@/` alias.
   - Group imports: React/Next.js first, then external libraries, then internal components/hooks.

## Git & Version Control

1. **Commit Messages**: Use clear, descriptive messages (e.g., `feat: add offline sync for vents`).
2. **Branching**: Use feature branches (`feat/name`) and pull requests for major changes.

## Performance & Optimization

1. **Image Optimization**: Always use the Next.js `<Image />` component for external images.
2. **Caching**: Use SWR for client-side caching and Next.js `unstable_cache` for server-side expensive queries.
3. **Bundle Size**: Monitor third-party library usage to keep the client bundle lean.


supabase gen types typescript --project-id uhifzkicgxczazecqeox > types/supabase.ts