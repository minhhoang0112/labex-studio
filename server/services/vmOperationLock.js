import { cloudError } from './cloudConfig.js';

// One shared lock for all guest-mutating operations in this backend process.
// Durable scenario state separately prevents another scenario after a restart.
const active = new Map();
export function isVmBusy(target) { return active.has(target); }
export function acquireVmLock(target, action) {
  if (active.has(target)) throw cloudError('VM đang xử lý thao tác khác. Vui lòng chờ.', 409, 'CLOUD_BUSY');
  active.set(target, action);
  return () => active.delete(target);
}
export async function withVmLock(target, action, callback) {
  const release = acquireVmLock(target, action);
  try { return await callback(); }
  finally { release(); }
}
