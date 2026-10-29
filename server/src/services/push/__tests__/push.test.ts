import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  FcmSender,
  PushChatInfo,
  PushDispatchDeps,
  PushPayload,
  PushSettings,
} from '../../../types/push.js';
import { parseServiceAccount, resolvePushSettings, toPublicConfig } from '../config.js';
import {
  buildConnectionPayload,
  buildMessagePayload,
  buildModNeededPayload,
  createPushDispatcher,
  selectRecipients,
} from '../dispatch.js';
import { buildFcmBody, createFcmSender } from '../fcm.js';
import { createThrottle } from '../throttle.js';
import { buildConnectionPushes } from '../../connection/complete.js';

const account = { client_email: 'a@b.iam.gserviceaccount.com', private_key: 'k' };
const envInput = {
  FCM_PROJECT_ID: 'proj',
  FCM_SERVICE_ACCOUNT_JSON: JSON.stringify(account),
  FCM_WEB_API_KEY: 'key',
  FCM_WEB_APP_ID: 'app',
  FCM_WEB_SENDER_ID: '123',
  FCM_WEB_VAPID_KEY: 'vapid',
};
const settings = resolvePushSettings(envInput) as PushSettings;

describe('config', () => {
  it('parses raw and base64 service-account JSON', () => {
    assert.deepEqual(parseServiceAccount(JSON.stringify(account)), account);
    const b64 = Buffer.from(JSON.stringify(account)).toString('base64');
    assert.deepEqual(parseServiceAccount(b64), account);
  });
  it('rejects garbage without throwing', () => {
    assert.equal(parseServiceAccount('not json'), null);
    assert.equal(parseServiceAccount('{"a":1}'), null);
  });
  it('is disabled when any value is missing', () => {
    assert.equal(resolvePushSettings({ ...envInput, FCM_WEB_VAPID_KEY: '' }), null);
    assert.deepEqual(toPublicConfig(null), { enabled: false });
  });
  it('exposes only public identifiers when enabled', () => {
    assert.deepEqual(toPublicConfig(settings), {
      enabled: true,
      firebase: { apiKey: 'key', projectId: 'proj', appId: 'app', messagingSenderId: '123' },
      vapidKey: 'vapid',
    });
  });
});

describe('payloads', () => {
  const chat: PushChatInfo = { members: [], groupChat: true, name: 'Crew' };
  it('never includes message text; titles per chat type', () => {
    const group = buildMessagePayload('c1', { kind: 'message', senderName: 'Ann', hasAttachment: false }, chat);
    assert.equal(group.title, 'Ann in Crew');
    assert.equal(group.body, 'New message');
    const dm = buildMessagePayload('c1', { kind: 'message', senderName: 'Ann', hasAttachment: true }, { ...chat, groupChat: false });
    assert.equal(dm.title, 'Ann');
    assert.equal(dm.body, 'Sent an attachment');
    assert.equal(dm.url, '/chats/c1');
    assert.equal(dm.tag, 'chat-c1');
  });
  it('FCM body is data-only with string values and headers', () => {
    const p: PushPayload = { title: 't', body: 'b', url: '/u', tag: 'x', urgent: true };
    const { message } = buildFcmBody('tok', p);
    assert.equal('notification' in message, false);
    assert.ok(Object.values(message.data).every((v) => typeof v === 'string'));
    assert.deepEqual(message.webpush.headers, { TTL: '3600', Urgency: 'high' });
    assert.equal(buildFcmBody('tok', { ...p, urgent: false }).message.webpush.headers.Urgency, 'normal');
  });
});

describe('forward + connection payloads', () => {
  const chat: PushChatInfo = { members: [], groupChat: true, name: 'Crew' };
  const fwd = { kind: 'message' as const, senderName: 'Ann', hasAttachment: true, forwarded: true };
  it('forward: generic body, chat url/tag, group title', () => {
    const g = buildMessagePayload('c1', fwd, chat);
    assert.deepEqual(
      [g.title, g.body, g.url, g.tag],
      ['Ann in Crew', 'Forwarded a message', '/chats/c1', 'chat-c1']
    );
    assert.equal(buildMessagePayload('c1', fwd, { ...chat, groupChat: false }).title, 'Ann');
  });
  it('connection: names the peer, chats route, tag connection', () => {
    assert.deepEqual(buildConnectionPayload('Misty Fox'), {
      title: 'Connection saved',
      body: 'Misty Fox is now in your chats',
      url: '/chats',
      tag: 'connection',
      urgent: false,
    });
  });
  it('connection pushes: each side gets the other side name', () => {
    const n = buildConnectionPushes(['u1', 'u2'], ['Fox', 'Owl']);
    assert.deepEqual(n.map((x) => x.members), [['u1'], ['u2']]);
    assert.deepEqual(n.map((x) => x.push), [
      { kind: 'connection', displayName: 'Owl' },
      { kind: 'connection', displayName: 'Fox' },
    ]);
  });
});

describe('throttle', () => {
  it('allows one per (user, tag) per window, then again after', () => {
    let t = 0;
    const th = createThrottle(30_000, () => t);
    assert.equal(th.allow('u', 'a'), true);
    assert.equal(th.allow('u', 'a'), false);
    assert.equal(th.allow('u', 'b'), true);
    assert.equal(th.allow('v', 'a'), true);
    t = 30_001;
    assert.equal(th.allow('u', 'a'), true);
  });
});

describe('recipients', () => {
  it('keeps offline non-sender users only', () => {
    const online = new Set(['b']);
    assert.deepEqual(
      selectRecipients(['a', 'b', 'c', 'c'], 'a', (id) => online.has(id)),
      ['c']
    );
  });
});

const jsonRes = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status });

describe('fcm sender', () => {
  const payload: PushPayload = { title: 't', body: 'b', url: '/u', tag: 'x', urgent: false };
  const make = (res: Response) =>
    createFcmSender(settings, { fetch: async () => res, getAccessToken: async () => 'at' });
  it('maps 404 and UNREGISTERED to invalid-token', async () => {
    assert.equal(await make(jsonRes(404, { error: { status: 'NOT_FOUND' } })).send('t', payload), 'invalid-token');
    const unreg = { error: { details: [{ errorCode: 'UNREGISTERED' }] } };
    assert.equal(await make(jsonRes(400, unreg)).send('t', payload), 'invalid-token');
  });
  it('400 about the token is dead; other errors are not', async () => {
    const bad = { error: { status: 'INVALID_ARGUMENT', message: 'The registration token is not valid' } };
    assert.equal(await make(jsonRes(400, bad)).send('t', payload), 'invalid-token');
    assert.equal(await make(jsonRes(500, {})).send('t', payload), 'error');
    assert.equal(await make(new Response('{}', { status: 200 })).send('t', payload), 'ok');
  });
  it('never throws on network failure', async () => {
    const sender = createFcmSender(settings, {
      fetch: async () => { throw new Error('down'); },
      getAccessToken: async () => 'at',
    });
    assert.equal(await sender.send('t', payload), 'error');
  });
});

describe('dispatcher', () => {
  const build = (result: 'ok' | 'invalid-token', enabled = true) => {
    const sent: string[] = [];
    const removed: string[] = [];
    const sender: FcmSender = { send: async (token) => { sent.push(token); return result; } };
    const deps: PushDispatchDeps = {
      enabled,
      sender,
      throttle: createThrottle(),
      loadChat: async () => ({ members: ['a', 'b', 'c'], groupChat: false, name: 'x' }),
      loadTokens: async (ids) => ids.map((id) => `tok-${id}`),
      removeTokens: async (t) => { removed.push(...t); },
    };
    return { dispatcher: createPushDispatcher(deps), sent, removed };
  };
  const notify = [{
    event: 'NEW_MESSAGE_ALERT', chatId: 'c1', excludeUserId: 'a',
    push: { kind: 'message' as const, senderName: 'A', hasAttachment: false },
  }];

  it('sends to offline non-sender members and throttles repeats', async () => {
    const { dispatcher, sent } = build('ok');
    await dispatcher.dispatch(notify, (id) => id === 'b');
    assert.deepEqual(sent, ['tok-c']);
    await dispatcher.dispatch(notify, (id) => id === 'b');
    assert.deepEqual(sent, ['tok-c']);
  });
  it('removes tokens FCM reports as dead', async () => {
    const { dispatcher, removed } = build('invalid-token');
    await dispatcher.dispatch(notify, () => false);
    assert.deepEqual(removed.sort(), ['tok-b', 'tok-c']);
  });
  it('no-ops when disabled', async () => {
    const { dispatcher, sent } = build('ok', false);
    await dispatcher.dispatch(notify, () => false);
    assert.equal(sent.length, 0);
  });
  it('friend request goes to the offline receiver', async () => {
    const { dispatcher, sent } = build('ok');
    await dispatcher.dispatch(
      [{ event: 'NEW_REQUEST', members: ['b'], push: { kind: 'request', senderName: 'A' } }],
      () => false
    );
    assert.deepEqual(sent, ['tok-b']);
  });
  it('accepted request goes to the offline sender', async () => {
    const { dispatcher, sent } = build('ok');
    await dispatcher.dispatch(
      [{ event: 'REFETCH_CHATS', members: ['b'], push: { kind: 'request-accepted', accepterName: 'A' } }],
      () => false
    );
    assert.deepEqual(sent, ['tok-b']);
  });
  it('connection push reaches only the offline side', async () => {
    const { dispatcher, sent } = build('ok');
    await dispatcher.dispatch(
      buildConnectionPushes(['a', 'b'], ['Fox', 'Owl']),
      (id) => id === 'a'
    );
    assert.deepEqual(sent, ['tok-b']);
  });
  it('forward push skips online members and the sender', async () => {
    const { dispatcher, sent } = build('ok');
    await dispatcher.dispatch(
      [{
        event: 'NEW_MESSAGE_ALERT', chatId: 'c1', excludeUserId: 'a',
        push: { kind: 'message', senderName: 'A', hasAttachment: false, forwarded: true },
      }],
      (id) => id === 'b'
    );
    assert.deepEqual(sent, ['tok-c']);
  });
});

describe('mod-needed push', () => {
  it('payload: title, count body, room url, per-room tag', () => {
    assert.deepEqual(buildModNeededPayload('venting', 'Venting', 4), {
      title: 'Venting needs a moderator',
      body: '4 waiting',
      url: '/rooms/venting',
      tag: 'room-mod-venting',
      urgent: false,
    });
  });

  it('throttle accepts a per-tag window and honours it', () => {
    let t = 0;
    const th = createThrottle(30_000, () => t);
    assert.equal(th.allow('m', 'room-mod-venting', 600_000), true);
    t = 599_000;
    assert.equal(th.allow('m', 'room-mod-venting', 600_000), false);
    t = 600_001;
    assert.equal(th.allow('m', 'room-mod-venting', 600_000), true);
  });

  it('reaches online mods too, once per 10 minutes', async () => {
    const sent: string[] = [];
    let t = 0;
    const dispatcher = createPushDispatcher({
      enabled: true,
      sender: { send: async (token) => { sent.push(token); return 'ok'; } },
      throttle: createThrottle(30_000, () => t),
      loadChat: async () => null,
      loadTokens: async (ids) => ids.map((id) => `tok-${id}`),
      removeTokens: async () => undefined,
    });
    const n = [{
      event: 'mod-needed', members: ['m1'],
      push: { kind: 'mod-needed' as const, slug: 'venting', title: 'Venting', waiting: 2 },
    }];
    await dispatcher.dispatch(n, () => true);
    assert.deepEqual(sent, ['tok-m1']);
    t = 5 * 60_000;
    await dispatcher.dispatch(n, () => true);
    assert.deepEqual(sent, ['tok-m1']);
    t = 10 * 60_000 + 1;
    await dispatcher.dispatch(n, () => true);
    assert.deepEqual(sent, ['tok-m1', 'tok-m1']);
  });
});
