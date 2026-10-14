import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canActOn,
  deleteRoomMessage,
  isMuted,
  isShadowMuted,
  muteMember,
  pruneExpiredMods,
  shadowMuteMember,
  unhideRoomMessage,
} from '../mods.js';
import { postRoomMessage } from '../messaging.js';
import { recordRoomReport } from '../autohide.js';
import { appendMessage, clearRegistry, hideMessage, joinInstance, recentMessages } from '../registry.js';
import { guest, seat, template } from './helpers.js';

describe('room mods', () => {
  it('members cannot moderate; mods can delete, unhide and mute', () => {
    clearRegistry();
    try {
      const { instanceId } = seat('mods-m', 'M', 'mod');
      seat('mods-u', 'U');
      const msg = appendMessage(instanceId, { alias: 'U', color: 'blue', role: 'member', text: 'hello', senderGid: 'mods-u' });
      assert.ok(msg);

      assert.equal(deleteRoomMessage(instanceId, 'mods-u', msg.id), false);
      assert.equal(muteMember(instanceId, 'mods-u', 'mods-m', 5), false);
      assert.equal(muteMember(instanceId, 'mods-m', 'mods-m', 5), false); // not yourself

      assert.equal(deleteRoomMessage(instanceId, 'mods-m', msg.id), true);
      assert.equal(recentMessages(instanceId).some((m) => m.id === msg.id), false);
      assert.equal(hideMessage(instanceId, msg.id), false); // already hidden
      assert.equal(unhideRoomMessage(instanceId, 'mods-u', msg.id), null); // members cannot
      assert.equal(unhideRoomMessage(instanceId, 'mods-m', msg.id)?.id, msg.id);

      assert.equal(muteMember(instanceId, 'mods-m', 'mods-u', 60), true);
      assert.equal(isMuted(instanceId, 'mods-u'), true);
      assert.equal(isMuted(instanceId, 'mods-m'), false);
      const res = postRoomMessage({ instanceId, identity: guest('mods-u'), text: 'can I talk?' });
      assert.ok('ok' in res && res.code === 'muted');
    } finally {
      clearRegistry();
    }
  });
});

describe('role hierarchy', () => {
  it('mods cannot act on the host or other mods; the host can act on mods', () => {
    clearRegistry();
    try {
      const { instanceId } = seat('rh-host', 'Host', 'host');
      seat('rh-mod1', 'Mod1', 'mod');
      seat('rh-mod2', 'Mod2', 'mod');
      seat('rh-user', 'User');

      assert.equal(canActOn(instanceId, 'rh-mod1', 'rh-host'), false);
      assert.equal(canActOn(instanceId, 'rh-mod1', 'rh-mod2'), false);
      assert.equal(muteMember(instanceId, 'rh-mod1', 'rh-host', 5), false);
      assert.equal(shadowMuteMember(instanceId, 'rh-mod1', 'rh-mod2', 5), false);
      assert.equal(isMuted(instanceId, 'rh-host'), false);
      assert.equal(isShadowMuted(instanceId, 'rh-mod2'), false);

      assert.equal(canActOn(instanceId, 'rh-mod1', 'rh-user'), true);
      assert.equal(canActOn(instanceId, 'rh-host', 'rh-mod1'), true);
      assert.equal(muteMember(instanceId, 'rh-host', 'rh-mod1', 5), true);
      assert.equal(canActOn(instanceId, 'rh-user', 'rh-mod1'), false);
      assert.equal(canActOn(instanceId, 'rh-host', 'rh-host'), false);
    } finally {
      clearRegistry();
    }
  });

  it('mute state is dropped when the instance closes and when it expires', () => {
    clearRegistry();
    try {
      const { instanceId } = seat('prune-m', 'M', 'mod');
      seat('prune-u', 'U');
      muteMember(instanceId, 'prune-m', 'prune-u', 1);
      assert.equal(isMuted(instanceId, 'prune-u'), true);
      pruneExpiredMods(Date.now() + 2 * 60_000);
      assert.equal(isMuted(instanceId, 'prune-u'), false);
      muteMember(instanceId, 'prune-m', 'prune-u', 60);
      clearRegistry();
      const fresh = joinInstance({ template, identity: guest('prune-u'), alias: 'U', color: '#fff' });
      assert.equal(isMuted(fresh.instanceId, 'prune-u'), false);
    } finally {
      clearRegistry();
    }
  });
});

describe('auto-hide on reports', () => {
  it('hides at three distinct SEATED reporters, never deletes', () => {
    clearRegistry();
    try {
      const { instanceId } = seat('ah-author', 'A');
      for (const r of ['ah-r1', 'ah-r2', 'ah-r3']) seat(r, r);
      const msg = appendMessage(instanceId, { alias: 'A', color: 'red', role: 'member', text: 'reported', senderGid: 'ah-author' });
      assert.ok(msg);
      assert.equal(recordRoomReport(instanceId, msg.id, 'ah-r1'), false);
      assert.equal(recordRoomReport(instanceId, msg.id, 'ah-r1'), false); // same reporter twice
      assert.equal(recordRoomReport(instanceId, msg.id, 'ghost-1'), false); // not seated: ignored
      assert.equal(recordRoomReport(instanceId, msg.id, 'ghost-2'), false);
      assert.equal(recordRoomReport(instanceId, msg.id, 'ah-r2'), false);
      assert.equal(recordRoomReport(instanceId, msg.id, 'ah-r3'), true);
      assert.equal(recentMessages(instanceId).some((m) => m.id === msg.id), false);
      assert.equal(recentMessages(instanceId, 100, true).some((m) => m.id === msg.id), true);
    } finally {
      clearRegistry();
    }
  });
});
