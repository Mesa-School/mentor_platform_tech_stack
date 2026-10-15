# Conventions

Rules for anyone — human or agent — adding code to this frontend. Your kit's
`AGENTS.md` is the authority; this is the codebase-specific detail.

## Data fetching

- No component calls `fetch` or a Supabase/Mongo client directly. Components →
  hooks → services.
- Server state lives in TanStack Query. Never `useState` + `useEffect` to fetch:
  it re-fetches on every mount, races itself, has no cache and no invalidation —
  so after a mutation the list is stale until a hard refresh.
- Query keys come from `lib/api/query-keys.ts`. **Never an inline array
  literal** — `['users']` in one file and `['users', filters]` in another means
  invalidation misses one, and you go hunting in the mutation for a bug that is
  in the cache.
- Endpoint paths come from `lib/api/endpoints.ts`, so a backend route rename is a
  one-file change.
- Mutations invalidate the relevant keys so the UI updates with no reload.

## Route Handlers

See [`../src/app/api/README.md`](../src/app/api/README.md). In short: a handler is
a deliberate exception, it is a public HTTP endpoint, it checks the session
first, it validates with Zod, it returns the same envelope, and it sets
`export const dynamic = 'force-dynamic'` for anything user-specific.

## Types

- `types/api.ts` — envelope and pagination
- `types/models.ts` — domain models shared across features
- `types/enums.ts` — enums and their rankings
- Feature-local types stay in `features/<feature>/types.ts`
- No `any`, no `@ts-ignore`. Fix the type or ask.

## Styling

- Components never name a literal colour. No `bg-blue-600`, no hex, no `rgb()` —
  only semantic tokens: `bg-primary`, `text-muted-foreground`, `border-border`.
- Spacing comes from the scale. No `p-[13px]`.
- Every interactive element keeps a visible focus ring. `outline: none` without a
  replacement makes the app unusable by keyboard.
- Every input has a real `<label>`. A placeholder is not a label — it disappears
  the moment the user types.
- Touch targets ≥ 44×44px.
- Colour is never the only signal; status carries text or an icon too.

## Security

- Nothing secret in a `NEXT_PUBLIC_*` variable. That prefix means "printed in the
  JavaScript every visitor downloads".
  - Some public values genuinely belong there — a Supabase anon key, a Sentry
    DSN. **Classify each variable** as *public identifier* or *secret*; do not
    pattern-match on the name.
- Never `dangerouslySetInnerHTML` on user content without sanitising.
- External links carry `rel="noopener noreferrer"`.
- Errors shown to users are plain language. Never a stack trace, a raw API
  message, or a database error.
- Never import `lib/db/*` or `app/api/_lib/*` into a Client Component.

## Adding a feature

1. `src/features/<feature>/` with `components/`, `hooks/`, `services/`.
2. Types and Zod schemas in that folder.
3. The service calls `@/lib/api/client`; nothing else does.
4. Add its query keys to the central factory.
5. Handle all four states.
6. **No placeholder data.** If a screen needs data that does not exist yet, say
   so — do not invent numbers, names or rows that look real. This is the fastest
   way to ship something that demos perfectly and is connected to nothing.

## Commits

You commit. The agent does not.
