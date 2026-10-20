import { isValidId, loadLab } from '../data/catalog.js';
import { cloudError, getVmTargetConfig } from './cloudConfig.js';

export const isWindowsLab = lab => Boolean(lab && (lab.target_vm || /^(win-|win11-)/.test(lab.id || '')));
export function labVmTarget(lab) {
  const target = lab?.target_vm || 'server';
  getVmTargetConfig(target); // Validate against the fixed registry; never accept host/VM names from the browser.
  return target;
}
export function resolveVmTarget({ labId, target } = {}, findLab = loadLab) {
  if (target !== undefined) getVmTargetConfig(target);
  if (labId !== undefined) {
    const lab = isValidId(labId) && findLab(labId);
    // Boolean fixture support is retained for the existing injectable router tests.
    if (!lab || !(lab === true ? /^(win-|win11-)/.test(labId) : isWindowsLab(lab))) {
      throw cloudError('Chọn một bài Windows hợp lệ.', 400, 'CLOUD_INVALID_LAB');
    }
    const expected = labVmTarget(lab);
    if (target !== undefined && target !== expected) throw cloudError('Target không khớp bài học.', 400, 'CLOUD_INVALID_TARGET');
    return expected;
  }
  return target || 'server';
}
