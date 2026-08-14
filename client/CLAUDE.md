# Whisper-wave Client — Claude Code Standards

This file governs all code written or modified in `client/src/`. Read it in
full before making any change. These rules match the `.cursorrules` file but
with examples drawn from the actual codebase.

---

## Project Snapshot — Feature-Slice Structure

```
src/
  features/
    admin/
      api/index.ts
      components/         Dashboard.tsx, Groups.tsx, Messages.tsx, Users.tsx
      hooks/index.ts
      queryKeys.ts
      store.ts
      types.ts            ← ALL admin types live here
    auth/
      api/index.ts
      components/         LoginForm.tsx, RegisterForm.tsx, ...
      store.ts
      validators.ts
    chat/
      api/index.ts
      components/
        dialogs/          AddFriendsPanel.tsx, CreateGroupPanel.tsx, ...
        group/            AddMemberDialog.tsx
        list/             ChatList.tsx, ChatListItem.tsx, ...
        message/          ChatBox.tsx, MessageBubble.tsx, MessageContextMenu.tsx, ...
        panel/            ChatHeader.tsx, ChatInput.tsx, ChatsViewPanel.tsx, ...
          header/         DefaultActions.tsx, SelectModeActions.tsx
          search/         SearchDatePicker.tsx, SearchFilters.tsx, SearchResultItem.tsx
      hooks/
        panelTypes.ts     ← reference file for domain type placement in hooks folder
        useAddMember.ts
        useChatMessages.ts
        useChatQueries.ts
        useChatScroll.ts
        useChatSearch.ts
        useDeleteActions.ts
        useMessageActions.tsx
        useMessageMutations.ts
        useMessageQueries.ts
        useMessageSelection.ts
        ...
      queryKeys.ts
      stores/
        chatClipboard.ts
        chatClipboardUtils.ts
        presence.ts
      utils/
        messageUtils.ts
        unread.ts
    notifications/
      components/         NotificationDialog.tsx, NotificationItem.tsx, ...
      store.ts
    profile/
      components/
        shared-content/   FilesList.tsx, LinksList.tsx, MediaGrid.tsx
                          types.ts  ← local scope types for shared-content sub-slice
      hooks/              useProfilePanel.ts, useSharedContent.ts
      store.ts
  shared/
    components/
      attachment-menu/    AttachmentMenu.tsx, FilePreview.tsx
      charts/             AreaChart.tsx, BarChart.tsx, DoughnutChart.tsx, ...
      context-menu/       ContextMenu.tsx
      emoji-menu/         EmojiMenu.tsx
      icons/              AddMember.tsx, ArrowDown.tsx, ... (all SVG icon components)
      image-viewer/       ImageViewer.tsx, ImageViewerNav.tsx, ...
      loader/             AppLoader.tsx
      media/              MediaPlaceholder.tsx, RetryableMedia.tsx
      sidebar/            Sidebar.tsx, SidebarItem.tsx
      skeletons/          AvatarSkeleton.tsx, ChatMessageSkeleton.tsx, SkeletonBox.tsx
      tables/             Table.tsx
      ui/
        AvatarCard.tsx, AvatarInput.tsx, Button.tsx, DialogWrapper.tsx,
        DotsMenu.tsx, Dropdown.tsx, EmptyState.tsx, InputField.tsx, ...
        carousel/         Carousel.tsx
        loaders/          CircularLoader.tsx
        modal/            Modal.tsx, confirmation-modal/ConfirmationModal.tsx
        swipeable-tabs/   Tab.tsx, TabView.tsx
    constants/
      app.ts              BASE_URL, MAX_FILES, SEARCH_DEBOUNCE_MS, ...
      routes.ts
      socketEvents.ts
      uploadConfig.ts
    hooks/
      useAsyncMutation.ts
      useContextMenu.ts
      useError.ts
      useMediaQuery.ts
      useRetryableMediaSrc.ts
      useSocketEvent.ts
    types/
      index.ts            barrel re-exports
      user.ts             User, Avatar, ApiSuccess, MessageNotification, AdminStats
      icon.ts             IconProps
      ui.ts               (target) shared UI shape types — TabItem, EmptyStateConfig, etc.
      media.ts            (target) MediaFile, PhotoFilter, SharedLink
      socket.ts           (target) socket payload types — NewMessagePayload, etc.
  pages/
    Auth.tsx, Chat.tsx, Home.tsx, PageNotFound.tsx
    admin/AdminAuth.tsx
  layout/
    AppWrapper.tsx, AdminWrapper.tsx
  app/
    providers.tsx, queryClient.ts, router.tsx, RouteError.tsx
  socket/
    SocketProvider.tsx
  api/
    client.ts             axios instance
```

---

## Rule 1 — Folder Structure

New features go under `features/{domain}/` with the full slice:
`api/`, `components/`, `hooks/`, `stores/`, `utils/`, `types.ts`.

Do not create feature folders anywhere else. Do not put business logic in
`pages/`. Page components are routing entry points only.

---

## Rule 2 — Type & Interface Placement

### CORRECT — Props type in component file (only allowed type)

```tsx
// features/chat/components/message/MessageBubble.tsx
type Props = {
  message: ChatMessage;
  isMine: boolean;
};

const MessageBubble = ({ message, isMine }: Props) => {
  ...
};
```

### CORRECT — Private Params interface in a hook file

```ts
// features/chat/hooks/useMessageActions.tsx
interface Params {
  chatId: string | undefined;
  user: SocketUser;
  canModerateGroup: boolean;
  allMessages: ChatMessage[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}
```

### CORRECT — Data model types in the domain types.ts

```ts
// features/chat/hooks/panelTypes.ts  ← reference for this pattern
// All ChatMessage, ChatRow, MessagesPage, etc. live here, not in components.
export type ChatMessage = { _id: string; content?: string; ... };
```

### WRONG — Reusable type defined in a component file

```tsx
// BAD: MessageContextMenu.tsx exports MessageContextMenuOption
export type MessageContextMenuOption = {
  id: string;
  label: string;
  onClick: () => void;
};
// This type is used by other modules — it must live in features/chat/types.ts
```

### WRONG — Type defined in a hook and imported elsewhere

```ts
// BAD: defining ChatRow in a hook and importing it from there
// Move it to features/chat/types.ts or shared/types/
```

### Where each type lives in this project

| Type                                        | File                                        |
|---------------------------------------------|---------------------------------------------|
| `ChatMessage`, `ChatRow`, `MessagesPage`    | `features/chat/hooks/panelTypes.ts`         |
| `NewMessagePayload`, `ChatReadPayload`, ... | `shared/types/socket.ts` (move from panelTypes when refactoring) |
| `AdminUserRow`, `AdminGroupRow`             | `features/admin/types.ts`                   |
| `User`, `Avatar`, `ApiSuccess`              | `shared/types/user.ts`                      |
| `IconProps`                                 | `shared/types/icon.ts`                      |
| `MediaFile`, `PhotoFilter`, `SharedLink`    | `shared/types/media.ts`                     |
| Shared UI shapes (tab items, empty states)  | `shared/types/ui.ts`                        |

---

## Rule 3 — Constants & Config

### CORRECT

```ts
// shared/constants/app.ts
export const SEARCH_DEBOUNCE_MS = 450 as const;
export const MAX_FILES = 5 as const;
export const MAX_GROUP_NAME_LENGTH = 60 as const;
```

```ts
// shared/constants/uploadConfig.ts
export const UPLOAD_CONFIG = { ... } as const;
```

### WRONG

```tsx
// BAD — magic number directly in a component or hook
const timer = setTimeout(fn, 1200);
const MAX = 5;
```

---

## Rule 4 — Separation of Concerns

### CORRECT — component calls hooks, renders JSX only

```tsx
const ChatList = () => {
  const { chats, isLoading } = useChatQueries();
  const { handleSelect } = useChatListActions();

  return (
    <ul>
      {chats.map((chat) => (
        <ChatListItem key={chat._id} chat={chat} onSelect={handleSelect} />
      ))}
    </ul>
  );
};
```

### WRONG — business logic inside a component

```tsx
// BAD
const ChatList = () => {
  const [chats, setChats] = useState([]);
  useEffect(() => {
    fetchChats().then(setChats);
  }, []);
  const handleSelect = useCallback((id: string) => {
    // logic here
  }, []);
  ...
};
// Extract useEffect + useState to useChatQueries hook
// Extract handleSelect to useChatListActions hook
```

| Concern              | Where it lives                              |
|----------------------|---------------------------------------------|
| Data fetching        | `hooks/useXxxQueries.ts` (react-query)      |
| Mutations            | `hooks/useXxxMutations.ts`                  |
| Derived/computed UI  | `hooks/useXxx.ts`                           |
| Pure transforms      | `utils/xxxUtils.ts`                         |
| API calls            | `api/index.ts`                              |
| Global client state  | `stores/xxx.ts` (zustand)                   |

---

## Rule 5 — File Size

350 lines maximum. Over the limit: extract.
- Large component → split into sub-components in the same `components/` folder.
- Large hook → split into focused hooks (e.g., `useChatScroll` + `useChatMessages`).

Reference: `features/chat/hooks/` already demonstrates this correctly — scroll,
messages, queries, mutations, and selection are separate files.

---

## Rule 6 — Pure Utilities — No Side Effects

```ts
// CORRECT — features/chat/utils/messageUtils.ts
export const groupMessagesByDay = (messages: ChatMessage[]): TimelineItem[] => {
  // pure transform, no toast, no navigate, no hooks
};
```

```ts
// WRONG
export const deleteAndNotify = (id: string) => {
  deleteMessage(id);
  toast.success('Deleted'); // NO — side effects not allowed in utils
  navigate('/chat');        // NO
};
```

---

## Rule 7 — Context Menu Pattern

Reference implementation: `shared/hooks/useContextMenu.ts` +
`shared/components/context-menu/ContextMenu.tsx`

```ts
// CORRECT — each option carries its own onClick
const options: ContextMenuOption[] = [
  { label: 'Reply',   icon: <ReplyIcon />,   onClick: () => onReply(message._id) },
  { label: 'Copy',    icon: <CopyIcon />,    onClick: () => onCopy(message._id) },
  { label: 'Delete',  icon: <TrashIcon />,   onClick: () => onDelete(message._id), danger: true },
];
```

```ts
// WRONG — string dispatch
const handleMenuAction = (action: string) => {
  if (action === 'reply') onReply(id);  // NO
};
```

`ContextMenu` and `MessageContextMenu` already follow the correct pattern —
use them as the reference.

---

## Rule 8 — Exports from Component Files

```tsx
// CORRECT — only export the component (and Props if a direct parent needs it)
type Props = { label: string };
const Button = ({ label }: Props) => <button>{label}</button>;
export default Button;
// Props type export is acceptable only when the direct parent file imports it.
```

```tsx
// WRONG — MessageContextMenu.tsx currently exports MessageContextMenuOption
// That type is used in other files, so it must move to features/chat/types.ts
export type MessageContextMenuOption = { ... }; // move this out
```

---

## Rule 9 — Custom Hooks

```ts
// CORRECT
export const useChatScroll = (...) => { ... };   // features/chat/hooks/useChatScroll.ts
export const useContextMenu = (...) => { ... };  // shared/hooks/useContextMenu.ts
```

```ts
// WRONG — not prefixed with 'use'
export const chatScroll = (...) => { ... };
export const getChatScroll = (...) => { ... };
```

All hooks in `features/chat/hooks/` are correct references: `useChatMessages`,
`useChatScroll`, `useDeleteActions`, `useMessageSelection`, etc.

---

## Rule 10 — Naming Conventions

| Thing              | Convention             | Example                              |
|--------------------|------------------------|--------------------------------------|
| Components         | PascalCase             | `MessageBubble.tsx`, `AvatarCard.tsx`|
| Hooks              | camelCase + `use`      | `useChatScroll.ts`                   |
| Utility functions  | camelCase              | `formatFileSize`, `groupMessagesByDay`|
| Constants (scalar) | SCREAMING_SNAKE_CASE   | `MAX_FILES`, `SEARCH_DEBOUNCE_MS`    |
| Constants (object) | SCREAMING_SNAKE_CASE   | `UPLOAD_CONFIG`                      |
| Folders            | kebab-case             | `context-menu/`, `image-viewer/`, `swipeable-tabs/` |
| Type/util files    | camelCase or lowercase | `types.ts`, `messageUtils.ts`        |

---

## Rule 11 — No console.log

No `console.log`, `console.warn`, or `console.error` in committed code.
Delete them, do not comment them out.

---

## Rule 12 — Admin Types Isolation

```ts
// CORRECT — features/admin/types.ts
export type AdminUserRow = { _id: string; name?: string; ... };
export type AdminGroupRow = { _id: string; members?: unknown[]; ... };
export type AdminMessageRow = { _id: string; content?: string; ... };
```

```tsx
// WRONG — AdminUserRow defined inside Users.tsx or any component
type AdminUserRow = { ... }; // NO — move to features/admin/types.ts
```

---

## How to Add a New Feature

1. Create `src/features/{domain}/` with the full slice structure:
   ```
   features/my-feature/
     api/index.ts       # API calls
     components/        # .tsx files, one component per file
     hooks/             # useXxx.ts files
     stores/            # zustand stores if needed
     utils/             # pure functions
     types.ts           # ALL types for this feature
   ```
2. Put all data-model types in `types.ts` immediately — do not define them
   inline in components or hooks.
3. Register the route in `src/app/router.tsx`.
4. If the feature adds socket events, add event name constants to
   `shared/constants/socketEvents.ts`.
5. If the feature adds upload constraints, add to `shared/constants/uploadConfig.ts`.

---

## How to Add a New Shared Component

1. Create the file in the appropriate sub-folder of `shared/components/`.
   - UI primitives → `shared/components/ui/`
   - Icons → `shared/components/icons/`
   - Skeletons → `shared/components/skeletons/`
   - New category → create a new `kebab-case/` folder
2. Define the component's props as a local `type Props = { ... }` inside the
   component file.
3. If the props shape is reused by other components, extract the type to
   `shared/types/ui.ts` and import it from there.
4. Use `IconProps` from `shared/types/icon.ts` for all SVG icon components.
5. Export only the component as the default export.

---

## Reference Files

| Pattern                        | Reference file                                          |
|--------------------------------|--------------------------------------------------------|
| Domain types placement         | `features/chat/hooks/panelTypes.ts`                    |
| Private hook Params interface  | `features/chat/hooks/useMessageActions.tsx` (Params)   |
| Context menu options with onClick | `shared/hooks/useContextMenu.ts` + `shared/components/context-menu/ContextMenu.tsx` |
| Zustand store                  | `features/chat/stores/chatClipboard.ts`                |
| Pure utility functions         | `features/chat/utils/messageUtils.ts`                  |
| Admin types isolation          | `features/admin/types.ts`                              |
| Shared scalar constants        | `shared/constants/app.ts`                              |
| Socket event constants         | `shared/constants/socketEvents.ts`                     |
| Shared user types              | `shared/types/user.ts`                                 |
| Icon component + IconProps     | `shared/components/icons/Reply.tsx` + `shared/types/icon.ts` |
