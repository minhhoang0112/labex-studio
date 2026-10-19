import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopGateway } from '../server/services/desktopGateway.js';

test('desktop tickets expose no credentials and expire before WebSocket upgrade', async t => {
  let now = 100;
  const gateway = createDesktopGateway({ now: () => now, probe: async () => true,
    config: () => ({ password: 'SECRET_NOT_FOR_BROWSER', publicIp: 'fixed-vm', adminUsername: 'admin',
      vmName: 'vm', guacdHost: '127.0.0.1', guacdPort: 4822, rdpPort: 3389 }) });
  t.after(() => gateway.close());
  const session = await gateway.issue('win-test', { width: 1280, hostname: 'attacker.example' });
  assert.equal(session.path, '/ws/desktop');
  assert.ok(session.ticket.length >= 40);
  assert.equal(JSON.stringify(session).includes('SECRET'), false);
  assert.equal(JSON.stringify(session).includes('attacker'), false);
  now += 31000;
  let rejection = '';
  const request = { url: '/ws/desktop?ticket=' + session.ticket };
  const socket = { end: message => { rejection = message; } };
  gateway.upgrade(request, socket, Buffer.alloc(0));
  assert.match(rejection, /401 Unauthorized/);
  now = 100;
  rejection = '';
  gateway.upgrade(request, socket, Buffer.alloc(0));
  assert.match(rejection, /401 Unauthorized/, 'Consumed tickets cannot be replayed even if the clock changes');
});

test('desktop sessions fail clearly when the RDP secret or guacd is missing', async t => {
  const noSecret = createDesktopGateway({ config: () => ({ guacdHost: '127.0.0.1', guacdPort: 4822 }), probe: async () => true });
  const noDaemon = createDesktopGateway({ config: () => ({ password: 'secret', guacdHost: '127.0.0.1', guacdPort: 4822 }), probe: async () => false });
  t.after(() => { noSecret.close(); noDaemon.close(); });
  await assert.rejects(noSecret.issue('win-test'), error => error.code === 'CLOUD_RDP_CONFIG_REQUIRED');
  await assert.rejects(noDaemon.issue('win-test'), error => error.code === 'CLOUD_GUACD_UNAVAILABLE');
});
