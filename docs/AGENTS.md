<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment Workflow Review (`deploy.yml`)
1. **Missing Actual Deploy Step**: The current `.github/workflows/deploy.yml` only runs `.next/standalone` check. It does not actively push to a provider like Vercel or AWS.
2. **Secrets Warning**: Ensure that GitHub Secrets currently contain both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Recommendation**: Append a Vercel deployment action or push the output image to a Docker Hub registry using Docker build action, or append `vercel-action` to auto-deploy on successful build.

## Optimization TODOs for Agents
- [ ] Fix absolute `never[]` inference on all Supabase endpoints by strictly syncing `types_db.ts` to `group_members`, `direct_messages`, `replies` schemas using Supabase CLI.
- [ ] Implement `next/image` in `src/app/team/page.tsx` replacing generic `img` tags for automatic resolution optimization.
- [ ] Change unoptimized DB fetches inside `src/app/chat/dm/page.tsx` to utilize Edge functions or GraphQL if data complexity increases.
- [ ] Move large `.map` functions inside `useEffect` (like follow stats logic in `chat/dm/page.tsx`) into dedicated React hooks (`useNeuralFriends.ts`) to maintain pure UI components.
- [ ] Add Jest/Playwright tests asserting the "Honeypot" and rate limiting features to avoid potential spam regressions.
