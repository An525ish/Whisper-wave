# Whisper Wave — TODO

## Network & connectivity UX

**Verdict:** Good idea — do it in phases, not as one blanket "all actions" pass.

### Why it's worth doing

- Chat is real-time; users on mobile/slow Wi‑Fi need to know *why* something feels stuck.
- Without feedback, failed sends and stale lists feel like bugs (we already have optimistic sends — they need a clear offline/failed state).
- WhatsApp/Telegram pattern: one global status + retries on writes, not a custom network message on every button.

### Why not "everything at once"

- `navigator.onLine` is coarse (Wi‑Fi with no internet still shows "online").
- "Slow internet" has no reliable cross-browser signal; better as timeouts + "Still trying…" on long requests.
- Socket can be disconnected while HTTP still works (and vice versa) — need **two signals**: browser online + Socket.IO connected.
- Phase 1 should stay $0: no Sentry, no paid uptime services.

### Recommended phases

| Phase | Scope | Priority |
|-------|--------|----------|
| **1** | Global banner: offline / reconnecting / back online (browser `online`/`offline` + socket `connect`/`disconnect`) | High |
| **1** | Failed outbound message: visible failed state + tap to retry (text, attachments, GIF) | High |
| **2** | Outbound queue while offline: hold sends, flush when socket reconnects | Medium |
| **2** | Distinguish loading vs slow: after ~3s show "Still sending…" / "Still loading…" | Medium |
| **3** | Read-side: React Query `networkMode` / refetch on reconnect for chats & messages | Low |
| **3** | Optional: disable or warn on destructive actions when offline (delete, clear chat) | Low |

### Out of scope for now

- Per-action network toasts on every mutation (noisy).
- Custom "slow network" detector via `navigator.connection` (Safari gaps, flaky).
- Background sync / service worker offline cache (Phase 2+ product, extra complexity).

### Implementation notes (when we build)

- **Client:** small `useNetworkStatus` hook (online + socket connected); banner in `AppWrapper` or chat layout.
- **Client:** extend existing pending/failed message rows in `useChatMessages` / `ConversationPanel`.
- **Server:** no change required for Phase 1 banner; retries reuse existing APIs.
- **Test:** toggle DevTools → Network → Offline; kill server; throttle to Slow 3G.

---

## Image & video loading fallbacks

**Verdict:** Good idea for **user media** (chat attachments, shared content, viewer) — not for every `<img>` in the app.

### What we already have

| Piece | Role |
|-------|------|
| `RetryableMediaImage` / `RetryableMediaVideo` | Loading shimmer + error fallback + retry while URL warms up |
| `MediaPlaceholder` | Picture/video icon + shimmer (`/icons/picture-icon.svg`, `/icons/video-icon.svg`) |
| `useRetryableMediaSrc` | Handles load state, retries, Cloudinary transform |

**Already using RetryableMedia:** chat bubbles (`RenderAttachments`), profile shared media (`MediaGrid`, `ProfileActions`), image viewer (`ImageViewer`, `ImageViewerNav`).

**Separate path — avatars:** `@/components/ui/Image` fades in on load and swaps to `AVATAR_FALLBACK` on error, but shows **nothing** while loading (`opacity-0` until `onLoad`).

### Gaps (raw `<img>` / `<video>`, no loading placeholder)

- Admin: `MediaCard`, `AttachmentChip`, `LinkCard` thumbnails
- Composer: `FilePreview` (local blob preview — lower priority)
- Search: `SearchResultItem`, `SearchFilters` avatars
- `LinkPreview` og:image
- `GifPicker` tiles (external CDN — optional shimmer only)

### Recommended approach

| Surface | Use | Priority |
|---------|-----|----------|
| Chat attachments, shared media, viewer | Keep / extend `RetryableMedia*` | Done |
| Avatars (`Image.tsx`) | Add loading skeleton or `MediaPlaceholder` behind fade-in | Medium |
| Admin attachment grids | Migrate to `RetryableMedia*` or shared wrapper | Low |
| Static icons, logos, empty-state art | Leave as plain `<img>` | — |

### Rule for new code

User-uploaded **image or video URL from our CDN** → `RetryableMediaImage` / `RetryableMediaVideo`.  
Avatars / small thumbs → `Image` (after we add a loading state).  
Decorative assets → inline `<img>` is fine.

### Out of scope

- Placeholder on every icon, logo, and SVG in the app.
- Audio files already use a static music icon — no video-style loader needed.

---

_Add new items below as needed._
