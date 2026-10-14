import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { postRoomMessage } from '../messaging.js';
import { isShadowMuted, shadowMuteMember } from '../mods.js';
import { appendMessage, clearRegistry, joinInstance, recentMessages } from '../registry.js';
import { checkChallenge } from '../challenge.js';
import { guest, seat, template } from './helpers.js';

const post = (gid: string, text: string, extra: object = {}) =>
  postRoomMessage({ instanceId: 'test-room#1', identity: guest(gid), text, ...extra });

describe('room posting', () => {
  it('throws for strangers and stores clean posts under a server-minted id', () => {
    clearRegistry();
    try {
      assert.throws(() => post('pst1', 'hello?'), /not_joined/);
      seat('pst1', 'Poster');
      const res = post('pst1', 'hello everyone');
      assert.ok('message' in res && res.message.text === 'hello everyone');
      assert.match(res.message.id, /^[0-9a-f-]{36}$/);
      assert.equal(res.message.senderGid, 'pst1');
    } finally {
      clearRegistry();
    }
  });

  it('slow-modes guests and caps floods per identity', () => {
    clearRegistry();
    try {
      seat('pstmod', 'Moddy', 'mod');
      for (let i = 0; i < 20; i += 1) {
        const res = post('pstmod', `flood ${i} with enough words to dodge the duplicate check ${i}`);
        assert.ok('message' in res, `post ${i} should pass`);
      }
      const capped = post('pstmod', 'one more with plenty of words to stay unique 21');
      assert.ok('ok' in capped && capped.code === 'rate_limited');

      seat('pstslow', 'Slow');
      assert.ok('message' in post('pstslow', 'first'));
      const second = post('pstslow', 'second');
      assert.ok('ok' in second && second.code === 'slow_mode');
      assert.ok(typeof second.retryAfterMs === 'number' && second.retryAfterMs > 0);
    } finally {
      clearRegistry();
    }
  });

  it('blocks links for guests but keeps the sender able to post', () => {
    clearRegistry();
    try {
      seat('pstlink', 'Linker');
      const linked = post('pstlink', 'see https://example.com/x');
      assert.ok('ok' in linked && linked.code === 'blocked_link');
      assert.ok('message' in post('pstlink', 'unique thought here'));
    } finally {
      clearRegistry();
    }
  });

  it('only threads replies onto visible messages of the same instance', () => {
    clearRegistry();
    try {
      const { instanceId } = seat('pstrep', 'Replier');
      seat('pstrep2', 'Other');
      const parent = appendMessage(instanceId, { alias: 'X', color: '#fff', role: 'member', text: 'p', senderGid: 'x' });
      assert.ok(parent);
      const ok = post('pstrep', 'agree', { replyTo: parent.id });
      assert.ok('message' in ok && ok.message.replyTo === parent.id);
      const dangling = post('pstrep2', 'what?', { replyTo: 'nope' });
      assert.ok('message' in dangling && dangling.message.replyTo === undefined);
    } finally {
      clearRegistry();
    }
  });
});

describe('first-post challenge in posting', () => {
  it('asks a guest first, accepts the answer, then whitelists the gid', () => {
    clearRegistry();
    try {
      joinInstance({ template, identity: guest('chg1'), alias: 'Newbie', color: '#fff' });
      const first = post('chg1', 'hi all');
      assert.ok('ok' in first && first.code === 'challenge_required' && first.challenge);
      const [a, b] = (first.challenge?.prompt ?? '').split(' + ').map(Number);
      const wrong = post('chg1', 'hi all', { challenge: { token: first.challenge?.token, answer: '0' } });
      assert.ok('ok' in wrong && wrong.code === 'challenge_failed' && wrong.challenge);
      const solved = post('chg1', 'hi all', {
        challenge: { token: first.challenge?.token, answer: String((a ?? 0) + (b ?? 0)) },
      });
      assert.ok('message' in solved);
      // Whitelisted: the next post carries no challenge.
      assert.equal(checkChallenge({ gid: 'chg1', isMember: false }).ok, true);
    } finally {
      clearRegistry();
    }
  });

  it('members skip it entirely', () => {
    clearRegistry();
    try {
      joinInstance({ template, identity: { kind: 'member', userId: 'chm1', gid: 'chmg1' }, alias: 'Mem', color: '#fff' });
      const res = postRoomMessage({
        instanceId: 'test-room#1',
        identity: { kind: 'member', userId: 'chm1', gid: 'chmg1' },
        text: 'hello',
      });
      assert.ok('message' in res);
    } finally {
      clearRegistry();
    }
  });
});

describe('shadow mute', () => {
  it('echoes to the sender only, never the ring', () => {
    clearRegistry();
    try {
      const { instanceId } = seat('shm', 'M', 'mod');
      seat('shu', 'U');
      assert.equal(shadowMuteMember(instanceId, 'shm', 'shu', 60), true);
      assert.equal(isShadowMuted(instanceId, 'shu'), true);
      const res = post('shu', 'can anyone see this?');
      assert.ok('message' in res && res.shadowed === true);
      assert.deepStrictEqual(recentMessages(instanceId).map((m) => m.text).includes('can anyone see this?'), false);
    } finally {
      clearRegistry();
    }
  });

  it('still passes the flood limiter and automod', () => {
    clearRegistry();
    try {
      const { instanceId } = seat('shm2', 'M', 'mod');
      seat('shu2', 'U');
      shadowMuteMember(instanceId, 'shm2', 'shu2', 60);
      const blocked = post('shu2', 'see https://example.com');
      assert.ok('ok' in blocked && blocked.code === 'blocked_link');
      let last = post('shu2', 'x');
      for (let i = 0; i < 25; i += 1) last = post('shu2', `spam ${i}`);
      assert.ok('ok' in last && last.code === 'rate_limited');
    } finally {
      clearRegistry();
    }
  });
});

describe('self-harm language in posting', () => {
  it('flags support on allowed AND blocked posts', () => {
    clearRegistry();
    try {
      seat('sha', 'A');
      const posted = post('sha', 'i want to kill myself tonight');
      assert.ok('message' in posted && posted.support === true);
      const refused = post('sha', 'i feel like i want to die');
      assert.ok('ok' in refused && refused.ok === false && refused.support === true);
    } finally {
      clearRegistry();
    }
  });
});
