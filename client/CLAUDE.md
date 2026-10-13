# Whisper-wave Client — Engineering Standards

**Read this file in full before writing or modifying anything in `client/src/`.**
These rules are the single source of truth for how this codebase is structured
and written. They are non-negotiable. If a change would violate a rule, fix the
change — do not bend the rule. If a rule genuinely needs to change, update this
file and the Cursor mirrors in `.cursor/rules/client-architecture.mdc` +
`client-code-quality.mdc` in the same change so docs and code never drift.

Those `.mdc` files are the condensed Cursor mirrors of this doc (applied via
`globs: client/**`). Keep them in sync with this file.

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
8. **Don't Repeat Yourself.** A type, constant, or piece of logic is defined in
   exactly one place and imported everywhere else. Before writing anything, check
   whether it already exists. Copy-paste of a shape, a value, or a behavior is a
   defect — extract it (see §12).
9. **One HTTP client.** All API calls go through `@/shared/lib/api/client`. Never
   add axios or a second client that skips cookies / 401 refresh. The one sanctioned
   exception is `shared/lib/analytics.ts`, which posts to a third-party collector
   (not our API) and therefore must not send our cookies — it uses `sendBeacon` so
   events survive page unload.
10. **Query keys live in `hooks/queryKeys.ts`**, owned by the domain that owns the
    resource — never inline `queryKey: ['…']`.

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
| Forms + validation | react-hook-form v7 + Zod v4                 | All forms; Zod schemas + field validators |
| Routing            | react-router-dom v7                         | Route table in `app/router.tsx` |
| Realtime           | socket.io-client v4                         | Via `shared/lib/socket` + `useSocketEvent` |
| HTTP               | `shared/lib/api/client` (fetch)             | Cookies, refresh; feature `api/` wraps it |
| Dates              | dayjs                                       | No manual date math |
| Types              | TypeScript (strict)                         | No `any`; prefer inference + `unknown` |

Modern expectations that follow from this stack:
- **Server data is never stored in `useState`/`useEffect`.** Use TanStack Query
  (`useQuery`/`useMutation`/`useInfiniteQuery`). `useEffect` is for syncing with
  non-React systems only (subscriptions, DOM, sockets), never for fetching.
- **Forms use react-hook-form + Zod** in the feature (schemas + `validate` helpers,
  e.g. `authValidators.ts`). The Zod schema is the source of truth for shape/rules;
  derive types with `z.infer`. Do not invent a second validation stack.
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
├── pages/                    # Route entries. THIN. Compose features + route params only.
│   ├── Home.tsx  Chat.tsx  Auth.tsx  Landing.tsx  SparkPass.tsx  PageNotFound.tsx
│   ├── admin/AdminAuth.tsx
│   └── legal/Privacy.tsx  Terms.tsx  ReportAbuse.tsx
│
├── layout/                   # App-shell layout wrappers (AppWrapper, AdminWrapper)
│                             #   app-wide presence/alert sockets OK here; message cache in features
│
├── features/                 # THE BUSINESS FUNCTIONALITY — one folder per domain
│   └── <domain>/             #   auth · chat · admin · profile · notifications · landing
│       ├── api/              #   HTTP helpers via shared api client — no logic, no UI
│       ├── components/       #   this domain's React components (may nest by sub-area)
│       ├── hooks/            #   useXxxQueries / useXxxMutations / useXxx / queryKeys.ts
│       ├── stores/           #   zustand store(s) for this domain  (or store.ts)
│       ├── utils/            #   pure, side-effect-free functions  (or utils.ts)
│       ├── constants.ts      #   domain constants (or constants/)
│       ├── types.ts          #   ALL data-model types for this domain (or types/)
│       └── index.ts          #   PUBLIC API — the ONLY entry other slices may import
│
├── shared/                   # Domain-AGNOSTIC. Must NOT import from features/.
│   ├── components/
│   │   ├── ui/               #   primitives: Button, InputField, Modal, Dropdown, ...
│   │   ├── icons/  charts/  skeletons/  media/  image-viewer/  sidebar/  tables/
│   ├── hooks/                #   useDebounce, useMediaQuery, useErrors, useAsyncMutation, useSocketEvent
│   ├── lib/                  #   framework glue to the outside world
│   │   ├── api/client.ts     #     fetch client + cookies + 401 refresh (ONLY HTTP client)
│   │   └── socket/           #     SocketProvider + socket client
│   ├── constants/            #   app.ts, socket.ts
│   ├── types/                #   user.ts, icon.ts, media.ts, socket.ts, ui.ts, index.ts (barrel)
│   └── utils/                #   cn, helpers, fileFormat, imageCompression, highlight, ...
│
├── assets/                   # static images/svgs imported by code
├── styles/                   # landing.css (lw-*); prefer not dumping more into root index.css
├── main.tsx                  # app bootstrap
└── vite-env.d.ts             # ImportMetaEnv allowlist for every VITE_*
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
   wires components together and reads route params. No forms, mutations, domain
   toasts, or fetch orchestration in `pages/` — push into a feature hook/component.
4. **Truly cross-cutting things live in `shared/`**: the `User` type, `ApiSuccess`,
   socket payload types, the fetch api client, UI primitives, `useErrors` /
   `useAsyncMutation` / `useSocketEvent`.
5. **Inside a feature, use relative imports only** (`./`, `../`). Never
   `import … from '@/features/<self>/…'`. Outsiders use `@/features/<domain>` only.

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
- Prefer a lean public API: export what pages/other features need, not every hook.

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
| HTTP calls             | `features/<domain>/api/…` (via `@/shared/lib/api/client`) |
| Query keys             | `features/<domain>/hooks/queryKeys.ts` only — no inline arrays |
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

### One HTTP client

All backend calls go through `api` from `@/shared/lib/api/client` (fetch, cookies,
401 refresh). Feature `api/*.ts` only wrap that client. Raw `fetch` only for
non-API blobs/downloads. XHR only for upload progress (e.g. R2). **Never add axios
or a second API client** — it will silently skip auth refresh.

**Sanctioned exception — analytics.** `shared/lib/analytics.ts` posts funnel
events to a third-party collector via `navigator.sendBeacon`, bypassing the API
client on purpose: it targets a foreign origin (so our cookies must NOT be sent)
and must survive page unload. It is a no-op when `VITE_ANALYTICS_ENDPOINT` is
unset, and it never attaches PII.

### Query key ownership

Every `queryKey` / factory lives in that feature's `hooks/queryKeys.ts`. Keys are
owned by the **domain that owns the resource**. Session/profile keys belong under
auth (or a shared keys module) — do not keep growing unrelated keys under chat.
Other features invalidate via the owner's public API / exported factories.

### Errors & toasts

- Query / load errors → `useErrors` (`shared/hooks/useError`).
- Mutations that need a loading toast → `useAsyncMutation`.
- One-off UX validation → `toast.*` in a **hook**, not deep leaf UI and not `pages/`.
- Avoid double-toasting the same failure.

---

## 7. State Management Rules

- **Server/remote data → TanStack Query only.** Never `useState` + `useEffect` +
  API `fetch`. Co-locate **all** query keys in `hooks/queryKeys.ts` — never
  `queryKey: ['…']` inline in a hook/component. Use `useInfiniteQuery` for
  paginated feeds, `useMutation` with cache updates/invalidation for writes.
- **Client/UI/session state → Zustand.** One store per concern; selectors to avoid
  needless re-renders. Do not put server data in Zustand.
- **Local, ephemeral state → `useState`/`useReducer`** inside the component.
- **Realtime → `useSocketEvent`** (in `shared/hooks`) subscribing to constants from
  `shared/constants/socket.ts`; socket handlers update the Query cache/stores,
  they don't hold their own copies of data.

---

## 8. Forms & Validation

Every form uses **react-hook-form + Zod** in the feature:

```ts
// Prefer: Zod schema + field validate helpers (see features/auth/utils/authValidators.ts)
export const emailSchema = z.string().email();
export const validateEmail = (v: string) => {
  const r = emailSchema.safeParse(v);
  return r.success || r.error.issues[0]?.message || 'Invalid';
};

const { register, handleSubmit } = useForm<FormValues>({ mode: 'onChange' });
<input {...register('email', { validate: validateEmail })} />
```

- Zod schemas are the source of truth for shape + rules; derive TS types with
  `z.infer` when you have an object schema. Keep schemas/validators in the feature.
- No manual `onChange` validation ladders outside RHF. Do not invent a second
  validation library.

---

## 9. Modern Coding Standards

- **React 19, function components + hooks only.** No class components, no legacy
  lifecycle, no `defaultProps`. Respect the Rules of Hooks (top-level, unconditional).
- **`useEffect` is a last resort** and only for synchronizing with external systems
  (DOM, sockets, subscriptions). Never fetch data in it. Always clean up.
- **Prefer derivation, composition, and early returns** over deep conditionals.
- **Async/await with real error handling.** No unhandled promises; surface failures
  through Query error states / `useErrors` / `useAsyncMutation`, not swallowed catches.
- **Accessibility:** semantic elements; every interactive control is keyboard-usable
  and focusable; icon-only buttons get `aria-label`; decorative SVGs get `aria-hidden`;
  visible focus states; respect `prefers-reduced-motion` for animations.
- **No `console.log/warn/error` in committed code.** Remove them; do not comment out.
- **No dead code, no commented-out blocks, no unused exports.**
- **Path alias `@/`** for cross-layer imports; relative imports only within the
  same feature/folder (including no `@/features/<self>/…`).
- **File size ≤ 350 lines.** Over → split: big component into sub-components in the
  same `components/` folder; big hook into focused hooks.
- **Env allowlist:** only `VITE_BASE_URL`, `VITE_GOOGLE_CLIENT_ID` and
  `VITE_ANALYTICS_ENDPOINT` (public; may be unset). Every `VITE_*` must appear on
  `ImportMetaEnv` in `vite-env.d.ts`. Never put secrets in `VITE_*`. Cookies only —
  no access tokens in `localStorage`. `VITE_ANALYTICS_ENDPOINT` is a **self-hosted /
  free** collector approved in `docs/TECH.md` — not a paid vendor; leaving it unset
  disables all analytics (see §0.9 for the transport rule that applies to it).
- **CSS homes:** app tokens/`@theme` in the root entry CSS (`index.css` today) —
  do not keep appending large feature blobs; extract or colocate. Landing-only
  (`lw-*`) → `styles/landing.css`. One-off composites → colocated CSS. Don't grow
  legacy `App.css` without consolidating.
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
5. New socket events → add name constants to `shared/constants/socket.ts`.
6. New queries → add keys to that feature's `hooks/queryKeys.ts` (never inline).

### Add a shared component
1. Place it in the right `shared/components/<category>/` folder (create a kebab-case
   category folder if none fits).
2. Local `type Props = {…}` in the file; reusable shapes go to `shared/types/ui.ts`.
3. It must stay domain-agnostic — receives data via props, never imports a feature.

### Before you consider a change done
- No file exceeds 350 lines; no `console.*`; no `any`; no `shared → features` import.
- No inline query keys; no second HTTP client; no new undeclared `VITE_*`.
- Run **`npm run typecheck`** and **`npm run lint`** — both must pass.
- New logic that isn't trivially obvious gets a test or a manual-verification note.

---

## 11. Anti-Patterns — Do Not Do These

- Fetching in `useEffect`/`useState` instead of TanStack Query.
- Inline `queryKey: ['…']` outside `hooks/queryKeys.ts`.
- Business logic, `.then()` chains, or heavy `useCallback`s inside a component.
- Fat pages with forms/mutations/toasts instead of feature hooks/components.
- A `shared/` file importing from `@/features/...`.
- Reaching into another feature's internals instead of its `index.ts`.
- Importing your own feature via `@/features/<self>/…` instead of relative paths.
- Adding axios / a second API client alongside `shared/lib/api/client`.
- Reusable types exported from component/hook files.
- Magic numbers/strings inline instead of `shared/constants` or a feature constant.
- Appending large feature CSS blobs to `index.css` / `App.css`.
- Files over 350 lines; God-components; barrel files that re-export everything.
- `console.*`, commented-out code, `any`, deprecated React APIs, class components.
- **Re-declaring a type/constant that already exists** (e.g. copying a socket
  payload shape or a timing constant into a component instead of importing it).
- **Copy-pasting logic or JSX** across files instead of extracting a shared hook,
  util, or component (see §12).
- Double-toasting the same error (e.g. `useAsyncMutation` + manual `toast.error`).

---

## 12. Don't Repeat Yourself — Single Source of Truth

Duplication is one of the most expensive defects in this codebase: when the same
shape, value, or behavior lives in two places, the two copies drift, and a fix in
one is silently missed in the other. Every fact has exactly one home.

**Before adding a type, constant, util, hook, or component, search for it first.**
If something close already exists, reuse or extend it — do not paste a second copy.

- **Types:** never re-declare a type that already lives in a types file. Import it.
  If two files need the same shape, it belongs in the appropriate `types.ts`
  (per §5), and both import it. A type defined for a component's own `Props` is the
  only local exception.
- **Constants:** timing values, storage keys, image paths, thresholds, tab configs,
  etc. are defined once in `shared/constants/` (cross-cutting) or a feature's
  `constants` (domain-specific), then imported. Never re-type the literal.
- **Logic:** if the same computation or side effect appears in ≥2 places, extract
  it — a pure transform to `utils/`, a stateful/side-effecting behavior to a hook
  (e.g. `useFileDownload`, `useEscapeKey`). Utils stay side-effect-free (§6); shared
  behavior with effects is a hook.
- **UI:** repeated markup/layout (drawers, panels, dialogs, cards, empty states)
  becomes a shared component or a render-prop wrapper (e.g. `SlideOverPanel`),
  parameterized by props — not copied per usage.
- **Single source, then re-export.** When consumers already import a symbol from
  file A but its true home should be file B, define it in B and have A re-export it,
  so existing import paths keep resolving without a wide sweep.

**Judgment:** DRY is about a single source of truth for one concept, not about
collapsing every superficially-similar line. Two values that are equal today but
change for different reasons are not duplication — keep them separate. Extract when
the things are the *same thing*, not merely similar-looking.



