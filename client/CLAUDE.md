# Whisper-wave Client — Engineering Standards

**Read this file in full before writing or modifying anything in `client/src/`.**
These rules are the single source of truth for how this codebase is structured
and written. They are non-negotiable. If a change would violate a rule, fix the
change — do not bend the rule. If a rule genuinely needs to change, update this
file (and `.cursorrules`) in the same change so docs and code never drift.

The mirror file `.cursorrules` contains the condensed version of these rules for
Cursor. Keep the two in sync.

---

## 0. Golden Rules (the short version)

1. **Feature-sliced architecture.** Business code lives in `src/features/<domain>/`.
   Generic, domain-agnostic code lives in `src/shared/`. Routes live in `src/pages/`.
2. **One-way dependencies.** `pages → features → shared`. Never backwards, never sideways.
   `shared/` must never import from `features/`. Features talk to each other only
   through a feature's public API (`features/<domain>/index.ts`), and rarely.
3. **Components render; hooks decide; utils compute; api fetches; stores hold state.**
   No data fetching, business logic, or side effects inside a component body.
4. **Every file earns its place.** You can look at any file and answer: *who owns
   this, what may it depend on, and why would it change?* If you can't, it's in the
   wrong folder.
5. **Modern, current, idiomatic.** Use the latest stable patterns of the tools below.
   No legacy React idioms, no deprecated APIs, no class components.
6. **Max 350 lines per file.** Over the limit → extract.
7. **Types, constants, and side-effect-free utils are never inlined ad hoc.** They
   have designated homes (below).

---

## 1. Tech Stack — Use It the Modern Way

This project runs a current, cutting-edge stack. Write code that matches it; do
not reach for older patterns.

| Concern            | Tool (pinned in package.json)              | Use it for |
|--------------------|--------------------------------------------|------------|
| UI                 | React 19 + TypeScript                      | Function components + hooks only |
| Build/dev          | Vite 8                                      | ESM, `@/` alias, code-splitting |
| Styling            | Tailwind CSS v4 (CSS-first `@theme`)        | Utilities; no runtime CSS-in-JS |
| Server state       | TanStack Query v5                           | All fetching, caching, mutations |
| Client state       | Zustand v5                                  | Cross-component UI/session state |
| Forms + validation | react-hook-form v7 + Zod v4                 | All forms; Zod is the schema source of truth |
| Routing            | react-router-dom v7                         | Route table in `app/router.tsx` |
| Realtime           | socket.io-client v4                         | Via `shared/lib/socket` + `useSocketEvent` |
| Dates              | dayjs                                       | No manual date math |
| Types              | TypeScript (strict)                         | No `any`; prefer inference + `unknown` |

Modern expectations that follow from this stack:
- **Server data is never stored in `useState`/`useEffect`.** Use TanStack Query
  (`useQuery`/`useMutation`/`useInfiniteQuery`). `useEffect` is for syncing with
  non-React systems only (subscriptions, DOM, sockets), never for fetching.
- **Forms use react-hook-form + a Zod schema** with `@hookform/resolvers`. The Zod
  schema is the single definition of the shape and its validation.
- **Prefer derivation over state.** Compute during render; reach for `useMemo`
  only for provably expensive work. Don't mirror props/query data into state.
- **Prefer composition and small components** over large conditional trees.
- **Accessibility is a requirement, not a nice-to-have** (see §9).

---

## 2. Folder Structure — The Canonical Tree

```text
src/
├── app/                      # Composition root ONLY. No business logic.
│   ├── router.tsx            #   route table (lazy-load heavy areas: admin, landing)
│   ├── providers.tsx         #   QueryClientProvider, SocketProvider, Helmet, Toaster
│   ├── queryClient.ts
│   └── RouteError.tsx
│
├── pages/                    # Route entries. THIN. Compose features; hold no logic.
│   ├── Home.tsx  Chat.tsx  Auth.tsx  Landing.tsx  SparkPass.tsx  PageNotFound.tsx
│   ├── admin/AdminAuth.tsx
│   └── legal/Privacy.tsx  Terms.tsx  ReportAbuse.tsx
│
├── layout/                   # App-shell layout wrappers (AppWrapper, AdminWrapper)
│
├── features/                 # THE BUSINESS FUNCTIONALITY — one folder per domain
│   └── <domain>/             #   auth · chat · admin · profile · notifications · landing
│       ├── api/              #   axios calls for this domain — no logic, no UI
│       ├── components/       #   this domain's React components (may nest by sub-area)
│       ├── hooks/            #   useXxxQueries / useXxxMutations / useXxx
│       ├── stores/           #   zustand store(s) for this domain  (or store.ts)
│       ├── utils/            #   pure, side-effect-free functions  (or utils.ts)
│       ├── constants.ts      #   domain constants (or constants/)
│       ├── types.ts          #   ALL data-model types for this domain
│       └── index.ts          #   PUBLIC API — the ONLY entry other slices may import
│
├── shared/                   # Domain-AGNOSTIC. Must NOT import from features/.
│   ├── components/
│   │   ├── ui/               #   primitives: Button, InputField, Modal, Dropdown, ...
│   │   ├── icons/  charts/  skeletons/  media/  image-viewer/  sidebar/  tables/
│   ├── hooks/                #   useDebounce, useMediaQuery, useContextMenu, useSocketEvent
│   ├── lib/                  #   framework glue to the outside world
│   │   ├── api/client.ts     #     the axios instance + interceptors
│   │   └── socket/           #     SocketProvider + socket client
│   ├── constants/            #   app.ts, routes.ts, socketEvents.ts, uploadConfig.ts
│   ├── types/                #   user.ts, icon.ts, media.ts, socket.ts, ui.ts, index.ts (barrel)
│   └── utils/                #   cn, helpers, fileFormat, imageCompression, highlight, ...
│
├── assets/                   # static images/svgs imported by code
├── styles/                   # global css (index.css entry, landing.css tokens)
├── main.tsx                  # app bootstrap
└── vite-env.d.ts
```

**No other top-level folders under `src/`.** No feature code in `pages/`, `app/`,
or `layout/`. No domain code in `shared/`.

### Which layer does a new file belong to?
- Is it specific to one product area (chat, auth, admin, profile, notifications, landing)?
  → `features/<that-domain>/…`
- Is it generic and reusable by any area, knowing nothing about the domain?
  → `shared/…`
- Is it a URL the user navigates to? → `pages/…` (and it just composes features).
- Is it app wiring (router/providers/query client)? → `app/…`

---

## 3. Dependency Rules — This *is* the Architecture

Folders are cosmetic; these boundaries are the real design. Enforce them.

```text
        pages  ──▶  features  ──▶  shared
                      │              ▲
                      └──────────────┘   (features may use shared; never the reverse)
```

1. **`shared/` never imports from `features/` or `pages/`.** If something in
   `shared/` needs domain knowledge, it isn't shared — move it into the owning
   feature. A `Button` knows nothing about auth, chat, or notifications.
2. **A feature never imports another feature's internals.** Cross-feature use goes
   through the target feature's public API only: `import { useSession } from '@/features/auth'`
   — never `import ... from '@/features/auth/hooks/useAuthMutations'`. Keep such
   cross-feature edges few; if two features share a lot, the shared part probably
   belongs in `shared/`.
3. **`pages/` compose features and layout; they contain no business logic.** A page
   wires components together and reads route params. If a page grows logic, push it
   into a feature hook.
4. **Truly cross-cutting things live in `shared/`**: the `User` type, the session
   hook, `ApiSuccess`, socket payload types, the axios client, UI primitives.

> If you catch yourself importing `@/features/x/...` from inside `shared/`, stop —
> that is the #1 architecture smell and always means the file is misplaced.

---

## 4. Feature Public API — `index.ts`

Every feature exposes a barrel `index.ts` that re-exports only what the outside
world is allowed to use (pages and, rarely, other features):

```ts
// features/auth/index.ts
export { default as LoginForm } from './components/LoginForm';
export { useSession } from './hooks/useSession';
export { useAuthStore } from './store';
export type { AuthUser } from './types';
```

- Outsiders import from `@/features/auth` — never reach into subpaths.
- Inside the same feature, use relative imports (`./`, `../`) freely; do not import
  your own feature via `@/features/...`.
- Do not export a feature's internal helpers/components that no one outside needs.

---

## 5. Type & Interface Placement — STRICT

- The only type allowed inside a `.tsx` component file is its own `type Props = {…}`,
  directly above the component. Nothing else.
- A hook `.ts` file may contain a single private `interface Params {…}` for its own
  argument bag. All other types live in a types file.
- All reusable/data-model types live in:

| Type category               | Home                              |
|-----------------------------|-----------------------------------|
| Domain data models          | `features/<domain>/types.ts`      |
| Shared UI shapes (TabItem…) | `shared/types/ui.ts`              |
| Media/file types            | `shared/types/media.ts`           |
| Socket payloads             | `shared/types/socket.ts`          |
| `User`, `Avatar`, `ApiSuccess` | `shared/types/user.ts`         |
| `IconProps`                 | `shared/types/icon.ts`            |

Never export a reusable type from a component or hook file and import it elsewhere.
Prefer `type` aliases; use `interface` only for the private hook `Params` bag or
when declaration-merging is genuinely needed. No `any` — use `unknown` + narrowing.

---

## 6. Separation of Concerns — Where Each Concern Lives

| Concern                | Where                                            |
|------------------------|--------------------------------------------------|
| Rendering / JSX        | component (`.tsx`) — presentational, no fetching |
| Data fetching          | `hooks/useXxxQueries.ts` (TanStack `useQuery`)   |
| Mutations              | `hooks/useXxxMutations.ts` (TanStack `useMutation`) |
| Derived/computed UI    | `hooks/useXxx.ts`                                |
| Pure transforms        | `utils/…` (no hooks, no toast, no navigate, no I/O) |
| HTTP calls             | `features/<domain>/api/…` (calls the shared axios client) |
| Query keys             | `features/<domain>/hooks/queryKeys.ts`           |
| Global client state    | `stores/…` (zustand)                             |
| Route wiring           | `app/router.tsx`                                 |

A component body should read like a description of the UI: call hooks at the top,
return JSX. If there is a `useEffect` doing a fetch, a `.then()`, or a non-trivial
`useCallback` with business rules, extract it to a hook.

```tsx
// GOOD — component calls hooks, renders JSX
const ChatList = () => {
  const { chats, isLoading } = useChatQueries();
  const { handleSelect } = useChatListActions();
  if (isLoading) return <ChatListSkeleton />;
  return <ul>{chats.map((c) => <ChatListItem key={c._id} chat={c} onSelect={handleSelect} />)}</ul>;
};
```

Pure utilities have **no side effects** — no `toast`, no `navigate`, no network,
no hooks. Side effects belong in hooks or event handlers.

---

## 7. State Management Rules

- **Server/remote data → TanStack Query only.** Never `useState` + `useEffect` +
  `fetch`. Co-locate query keys in `hooks/queryKeys.ts`. Use `useInfiniteQuery`
  for paginated feeds, `useMutation` with cache updates/invalidation for writes.
- **Client/UI/session state → Zustand.** One store per concern; selectors to avoid
  needless re-renders. Do not put server data in Zustand.
- **Local, ephemeral state → `useState`/`useReducer`** inside the component.
- **Realtime → `useSocketEvent`** (in `shared/hooks`) subscribing to constants from
  `shared/constants/socketEvents.ts`; socket handlers update the Query cache/stores,
  they don't hold their own copies of data.

---

## 8. Forms & Validation

Every form uses **react-hook-form + Zod**:

```ts
const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
type Values = z.infer<typeof schema>;
const form = useForm<Values>({ resolver: zodResolver(schema) });
```

- The Zod schema is the single source of truth for shape + rules; derive the TS
  type with `z.infer`. Keep schemas in the feature (`features/<domain>/…`).
- No manual `onChange` validation ladders; let RHF + Zod handle it.

---

## 9. Modern Coding Standards

- **React 19, function components + hooks only.** No class components, no legacy
  lifecycle, no `defaultProps`. Respect the Rules of Hooks (top-level, unconditional).
- **`useEffect` is a last resort** and only for synchronizing with external systems
  (DOM, sockets, subscriptions). Never fetch data in it. Always clean up.
- **Prefer derivation, composition, and early returns** over deep conditionals.
- **Async/await with real error handling.** No unhandled promises; surface failures
  through Query error states / `useError`, not swallowed catches.
- **Accessibility:** semantic elements; every interactive control is keyboard-usable
  and focusable; icon-only buttons get `aria-label`; decorative SVGs get `aria-hidden`;
  visible focus states; respect `prefers-reduced-motion` for animations.
- **No `console.log/warn/error` in committed code.** Remove them; do not comment out.
- **No dead code, no commented-out blocks, no unused exports.**
- **Path alias `@/`** for all cross-layer imports; relative imports only within the
  same feature/folder.
- **File size ≤ 350 lines.** Over → split: big component into sub-components in the
  same `components/` folder; big hook into focused hooks.
- **Naming:**

| Thing              | Convention           | Example                        |
|--------------------|----------------------|--------------------------------|
| Components/files   | PascalCase           | `MessageBubble.tsx`            |
| Hooks              | camelCase + `use`    | `useChatScroll.ts`             |
| Utilities          | camelCase            | `groupMessagesByDay`           |
| Scalar constants   | SCREAMING_SNAKE_CASE | `MAX_FILES`, `SEARCH_DEBOUNCE_MS` |
| Folders            | kebab-case           | `context-menu/`, `image-viewer/` |
| Types/type files   | PascalCase / camelCase file | `types.ts`, `ChatMessage` |

---

## 10. Playbooks

### Add a new feature
1. Create `features/<domain>/` with `api/ components/ hooks/ stores/ utils/ types.ts index.ts`
   (omit folders you genuinely don't need yet — don't scaffold empty ones).
2. Put all data-model types in `types.ts` immediately.
3. Export the feature's public surface from `index.ts`.
4. Register the route in `app/router.tsx` (lazy-load if heavy).
5. New socket events → add name constants to `shared/constants/socketEvents.ts`.

### Add a shared component
1. Place it in the right `shared/components/<category>/` folder (create a kebab-case
   category folder if none fits).
2. Local `type Props = {…}` in the file; reusable shapes go to `shared/types/ui.ts`.
3. It must stay domain-agnostic — receives data via props, never imports a feature.

### Before you consider a change done
- No file exceeds 350 lines; no `console.*`; no `any`; no `shared → features` import.
- Run **`npm run typecheck`** and **`npm run lint`** — both must pass.
- New logic that isn't trivially obvious gets a test or a manual-verification note.

---

## 11. Anti-Patterns — Do Not Do These

- Fetching in `useEffect`/`useState` instead of TanStack Query.
- Business logic, `.then()` chains, or heavy `useCallback`s inside a component.
- A `shared/` file importing from `@/features/...`.
- Reaching into another feature's internals instead of its `index.ts`.
- Reusable types exported from component/hook files.
- Magic numbers/strings inline instead of `shared/constants` or a feature constant.
- Files over 350 lines; God-components; barrel files that re-export everything.
- `console.*`, commented-out code, `any`, deprecated React APIs, class components.


