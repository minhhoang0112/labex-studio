import crypto from 'node:crypto';
import net from 'node:net';
import GuacamoleLite from 'guacamole-lite';
import { cloudConfig, cloudError } from './cloudConfig.js';

export function checkTcp(host, port, timeout = 2000) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port });
    let done = false;
    const finish = value => { if (!done) { done = true; socket.destroy(); resolve(value); } };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

export function createDesktopGateway({ config = cloudConfig, now = Date.now, probe = checkTcp } = {}) {
  const tickets = new Map();
  const key = crypto.randomBytes(32);
  const current = config();
  const bridge = new GuacamoleLite({ server: undefined, noServer: true, maxPayload: 1024 * 1024 },
    { host: current.guacdHost, port: current.guacdPort }, {
      crypt: { cypher: 'AES-256-CBC', key }, log: { level: 0 },
      maxInactivityTime: 60000,
      allowedUnencryptedConnectionSettings: { rdp: [] },
    });
  function encode(connection) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const json = JSON.stringify({ connection }).replace(/[^\x00-\x7F]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
    const value = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    return Buffer.from(JSON.stringify({ iv: iv.toString('base64'), value: value.toString('base64') })).toString('base64');
  }
  async function status() {
    const value = config();
    return { configured: Boolean(value.password), guacdAvailable: await probe(value.guacdHost, value.guacdPort),
      target: value.vmName, path: '/ws/desktop' };
  }
  async function issue(labId, { width = 1280, height = 800, dpi = 96 } = {}) {
    const available = await status();
    if (!available.configured) throw cloudError('Chưa cấu hình WINDOWS_ADMIN_PASSWORD ở backend.', 503, 'CLOUD_RDP_CONFIG_REQUIRED');
    if (!available.guacdAvailable) throw cloudError('Chưa kết nối được guacd. Chạy scripts/setup-guacd.py trong WSL.', 503, 'CLOUD_GUACD_UNAVAILABLE');
    for (const [ticket, item] of tickets) if (item.expires <= now()) tickets.delete(ticket);
    if (tickets.size >= 32) throw cloudError('Có quá nhiều yêu cầu Desktop. Thử lại sau.', 429, 'CLOUD_BUSY');
    const ticket = crypto.randomBytes(32).toString('base64url');
    tickets.set(ticket, { labId, expires: now() + 30000,
      width: Math.round(Math.max(640, Math.min(3840, Number(width) || 1280))),
      height: Math.round(Math.max(480, Math.min(2160, Number(height) || 800))),
      dpi: Math.round(Math.max(96, Math.min(192, Number(dpi) || 96))) });
    return { path: '/ws/desktop', ticket, expiresIn: 30 };
  }
  function upgrade(req, socket, head) {
    const url = new URL(req.url, 'http://localhost');
    const ticket = url.searchParams.get('ticket');
    const item = tickets.get(ticket);
    tickets.delete(ticket); // Every ticket is single-use, even a failed handshake.
    if (!item || item.expires <= now()) {
      socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      return;
    }
    const value = config();
    const settings = { hostname: value.publicIp, port: String(value.rdpPort),
      username: value.adminUsername, password: value.password, domain: process.env.WINDOWS_RDP_DOMAIN || '',
      security: 'nla', 'ignore-cert': process.env.WINDOWS_RDP_IGNORE_CERT === 'true' ? 'true' : 'false',
      width: item.width, height: item.height, dpi: item.dpi, 'resize-method': 'display-update',
      'color-depth': 32, 'enable-font-smoothing': 'true', 'force-lossless': 'true',
      image: ['image/png'],
      'enable-drive': 'false', 'enable-printing': 'false', 'disable-audio': 'true' };
    // guacamole-lite receives its encrypted token internally; the browser only
    // sees an opaque short-lived ticket. Never accept browser-supplied hosts.
    req.url = '/?token=' + encodeURIComponent(encode({ type: 'rdp', settings }));
    bridge.webSocketServer.handleUpgrade(req, socket, head, ws => bridge.webSocketServer.emit('connection', ws, req));
  }
  return { status, issue, upgrade, close: () => bridge.close() };
}
