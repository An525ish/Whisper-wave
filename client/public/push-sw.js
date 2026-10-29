/* Whisper Wave push service worker — raw Web Push, no Firebase SDK, no build step.
 * Registered only after the user opts in to push notifications. */

const ICON = '/logo-3.jpeg';
const BADGE = '/logo-4.png';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

/** Same-origin relative path only ("/x", never "//host" or absolute URLs). */
function safeUrl(raw) {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  try {
    const url = new URL(raw, self.location.origin);
    return url.origin === self.location.origin ? url.pathname + url.search + url.hash : '/';
  } catch {
    return '/';
  }
}

function readPayload(event) {
  try {
    const payload = event.data ? event.data.json() : {};
    // FCM nests app data under `.data`; plain Web Push is flat.
    return payload && typeof payload.data === 'object' && payload.data ? payload.data : payload;
  } catch {
    return {};
  }
}

async function hasFocusedWindow() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return windows.some((client) => client.visibilityState === 'visible' && client.focused);
}

self.addEventListener('push', (event) => {
  const { title, body, url, tag } = readPayload(event);
  event.waitUntil(
    hasFocusedWindow().then((focused) => {
      // The in-app socket UI already surfaces this while the app is in view.
      if (focused) return undefined;
      return self.registration.showNotification(title || 'Whisper Wave', {
        body: body || '',
        tag: tag || undefined,
        icon: ICON,
        badge: BADGE,
        data: { url: safeUrl(url) },
        renotify: false,
      });
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = safeUrl(event.notification.data && event.notification.data.url);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        if ('navigate' in existing) {
          try {
            await existing.navigate(target);
            return undefined;
          } catch {
            /* fall through to postMessage */
          }
        }
        existing.postMessage({ type: 'push-navigate', url: target });
        return undefined;
      }
      return self.clients.openWindow(target);
    }),
  );
});
