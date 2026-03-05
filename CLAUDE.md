# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (port 3000, turbo, with Chakra theme watcher)
yarn build        # Production build
yarn lint         # Regenerate Chakra tokens + ESLint
yarn prettier     # Format all TS/JS/TSX/JSX/GraphQL files

# API schema (OpenAPI → TypeScript types)
yarn pull-schema        # Pull from production API
yarn pull-schema-local  # Pull from localhost:8080

# Chakra UI theme token generation
yarn theme        # One-time token generation
yarn theme:watch  # Watch mode (runs automatically in `dev`)
```

There are no tests in this project.

## Architecture

**Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Chakra UI v2 (legacy), TanStack Query, React Hook Form + Zod.

### API Client

The project uses a custom type-safe fetch client (`app/utils/createApiClient.ts`) built on top of `openapi-typescript-helpers`. API types are auto-generated into `apiDocs.ts` from the backend's OpenAPI spec.

Two hooks wrap the API client:
- `useApi` (`app/(hooks)/useApi.ts`) — client-side; automatically redirects to `/login` on 401, throws on non-OK responses.
- `useApiServerSide` (`app/(hooks)/useApiServerSide.ts`) — server components/RSC; reads `jobsite-session` cookie and attaches it as a `Bearer` token.

### Authentication

Auth is cookie-based (`jobsite-session`). The `AuthenticatedLayout` component (`app/(components)/layout/authenticated-layout.tsx`) calls `/me` server-side and redirects to `/login?force` on failure. `TokenRefresher` (in `Providers`) silently refreshes the token every 5 minutes via `/login-user/refresh`.

`useMe()` provides the current user plus `logout`, `refresh`, and `setClient` helpers.

### Directory Conventions

- `app/(components)/` — shared React components; `layout/` for page structure, `shadcn/ui/` for shadcn primitives
- `app/(hooks)/` — custom hooks (API client wrappers, `useMe`, etc.)
- `app/(actions)/` — Next.js server actions
- `app/utils/` — pure utilities (`cn`, `routeHelper`, `types`, `createApiClient`)
- `app/theme/` — Chakra UI theme (must regenerate tokens after changes via `yarn theme`)
- `apiDocs.ts` — **auto-generated**, do not edit manually; regenerate with `yarn pull-schema`
- `typedEnvs.ts` — **auto-generated** by `typed-env-generator` from `env.schema.js` on `next build`/`next dev`

### Environment Variables

Defined in `env.schema.js` (Zod schema). Running `next dev` or `next build` auto-generates `typedEnvs.ts`. Access env vars via `EnvStore` from `typedEnvs.ts` — never access `process.env` directly in app code.

Currently only `NEXT_PUBLIC_API` is required (defaults to `http://localhost:8080`).

### Routing

Routes are typed in `app/utils/routeHelper.ts` (`RouteHelper.UnAuthed`, `RouteHelper.Authed`). The middleware (`middleware.ts`) is currently a passthrough (auth enforcement is done at the layout level).

Use `useAppRouter` (`app/(hooks)/useAppRouter.ts`) instead of Next.js's `useRouter` — it wraps the router with a progress bar and adds `updateSearchParam()` for query string updates.

Use `PageProps` from `app/utils/types.ts` for typing page `params`/`searchParams`.

### Styling

- Tailwind CSS v4 with `@tailwindcss/postcss`. Use the `cn()` utility from `@/utils/cn` for conditional class merging.
- shadcn/ui components live in `app/(components)/shadcn/ui/`. Add new ones via `npx shadcn@latest add [component-name]`.
- Chakra UI v2 is still present for some components (notably toasts in `tokenRefresh.tsx`). Prefer shadcn/ui for new components.
- ESLint enforces using the shadcn `Button` — the Chakra `Button` import is blocked.
- Prettier line length is 110 characters, single quotes, trailing commas (ES5).

### Data Fetching Pattern

Client pages use TanStack Query (`useQuery`/`useMutation`) with `useApi()`. Query keys follow the pattern `['resourceName', id?]`. Invalidate with `queryClient.invalidateQueries({ queryKey: ['resourceName'] })` after mutations.

Writes typically use manual `async/await` with try/catch (not `useMutation`):

```typescript
try {
  await api.POST('/endpoint', { body: data });
  queryClient.invalidateQueries({ queryKey: ['resourceName'] });
} catch (error) {
  // handle error
}
```

### Page & Form Patterns

Pages split into a server component (`page.tsx`) that handles auth/initial data, and a client component (`page.client.tsx`) for interactivity.

Forms use React Hook Form with Zod via `zodResolver`:

```typescript
const schema = z.object({ field: z.string().min(1) });
type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### Adding a New Authenticated Route

1. Create `app/[newroute]/layout.tsx` wrapping children with `AuthenticatedLayout`.
2. Create `app/[newroute]/page.tsx` as an async server component.
3. Create `app/[newroute]/page.client.tsx` for client-side interactivity.
4. Add the route to `RouteHelper.Authed` in `app/utils/routeHelper.ts`.
