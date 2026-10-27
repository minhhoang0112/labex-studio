import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { executeWindowsRemote } from './windowsRemoteExecutor.js';
import { cloudError, getVmTargetConfig } from './cloudConfig.js';
import { azureClient } from './azureComputeClient.js';
import { withVmLock } from './vmOperationLock.js';
import { loadLab } from '../data/catalog.js';
import { labVmTarget } from './vmTargets.js';

export const faultScenarios = Object.freeze({
  'win-it-printer-spooler-fix': 'spooler',
  'win-it-network-dns-troubleshoot': 'hosts',
  'win-it-disk-cleanup-recovery': 'disk',
  'win-it-file-extension-fix': 'extension',
  'win-it-app-config-repair': 'appconfig',
  'win-it-deleted-file-restore': 'restorefile',
  'win-it-scheduled-backup-fix': 'taskbackup',
  'win-it-scheduled-backup-permissions': 'taskacl',
  'win-it-file-in-use': 'filelock',
  'win-it-service-config-recovery': 'serviceconfig',
});
const script = fs.readFileSync(new URL('../runtime/windows/support-faults.ps1', import.meta.url), 'utf8');
const practiceScript = fs.readFileSync(new URL('../runtime/windows/practice-faults.ps1', import.meta.url), 'utf8');
const backupPermissionScript = fs.readFileSync(new URL('../runtime/windows/backup-permission-fault.ps1', import.meta.url), 'utf8');
const fileLockScript = fs.readFileSync(new URL('../runtime/windows/file-lock-fault.ps1', import.meta.url), 'utf8');
const serviceConfigScript = fs.readFileSync(new URL('../runtime/windows/service-config-fault.ps1', import.meta.url), 'utf8')
  .replace('__LABEX_SERVICE_SOURCE_B64__', fs.readFileSync(new URL('../runtime/windows/document-agent.cs', import.meta.url)).toString('base64'));
export function faultCommand(scenario, operation) {
  if (!Object.values(faultScenarios).includes(scenario) || !['Baseline', 'Inject', 'Faulted', 'Healthy', 'Reset'].includes(operation)) {
    throw cloudError('Kịch bản hoặc thao tác không hợp lệ.', 400, 'CLOUD_INVALID_SCENARIO');
  }
  const source = scenario === 'serviceconfig' ? serviceConfigScript : scenario === 'filelock' ? fileLockScript : scenario === 'taskacl' ? backupPermissionScript : ['spooler', 'hosts', 'disk'].includes(scenario) ? script : practiceScript;
  if (scenario === 'serviceconfig') {
    // Only server-owned curriculum is compressed, never browser-supplied code.
    // Keep the remote executor's command-length limits unchanged.
    const packed = gzipSync(Buffer.from(source, 'utf8')).toString('base64');
    return `$labexPacked=[IO.MemoryStream]::new([Convert]::FromBase64String('${packed}'))
$labexZip=[IO.Compression.GZipStream]::new($labexPacked,[IO.Compression.CompressionMode]::Decompress)
$labexReader=[IO.StreamReader]::new($labexZip,[Text.Encoding]::UTF8)
try{$labexCode=$labexReader.ReadToEnd()}finally{$labexReader.Dispose();$labexZip.Dispose();$labexPacked.Dispose()}
& ([scriptblock]::Create($labexCode)) -Operation '${operation}' -Scenario '${scenario}'`;
  }
  return `& {\n${source}\n} -Operation '${operation}' -Scenario '${scenario}'`;
}

export async function assertClientBaseline() {
  if (process.env.WINDOWS_CLIENT_RECOVERY_TESTED !== 'true') {
    throw cloudError('Chưa thử thành công khôi phục CLIENT01. Chưa cho phép nạp lỗi.', 409, 'CLOUD_BASELINE_REQUIRED');
  }
  const config = getVmTargetConfig('client');
  const name = process.env.WINDOWS_CLIENT_BASELINE_SNAPSHOT;
  if (!name) throw cloudError('Chưa cấu hình snapshot baseline CLIENT01.', 409, 'CLOUD_BASELINE_REQUIRED');
  const client = azureClient();
  let evidence;
  try { evidence = JSON.parse(fs.readFileSync(path.resolve('server/runtime/state/client-baseline.json'), 'utf8')); }
  catch { throw cloudError('Thiếu bằng chứng thử khôi phục CLIENT01.', 409, 'CLOUD_BASELINE_REQUIRED'); }
  const [vm, snapshot] = await Promise.all([client.virtualMachines.get(config.resourceGroup, config.vmName), client.snapshots.get(config.resourceGroup, name)]);
  const sameId = (left, right) => typeof left === 'string' && typeof right === 'string' && left.toLowerCase() === right.toLowerCase();
  if (vm.osProfile?.computerName !== 'CLIENT01' || vm.storageProfile?.imageReference?.publisher !== 'MicrosoftWindowsDesktop' ||
      !evidence.recoveryTested || evidence.vmName !== config.vmName || evidence.resourceGroup !== config.resourceGroup ||
      snapshot.provisioningState !== 'Succeeded' || !sameId(snapshot.id, evidence.snapshotId) ||
      !sameId(snapshot.creationData?.sourceResourceId, evidence.originalDiskId) || !sameId(vm.storageProfile?.osDisk?.managedDisk?.id, evidence.activeDiskId)) {
    throw cloudError('Snapshot/VM không khớp baseline CLIENT01.', 409, 'CLOUD_BASELINE_REQUIRED');
  }
}

export function createWindowsFaultService({ execute = executeWindowsRemote, baseline = assertClientBaseline,
  journal = path.resolve('server/runtime/state/windows-fault-session.json'), findLab = loadLab } = {}) {
  let lastProbe;
  function read() {
    try { return JSON.parse(fs.readFileSync(journal, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw cloudError('Không đọc được journal; khóa nạp lỗi để tránh ghi đè phiên.', 503, 'CLOUD_SESSION_CORRUPT'); }
  }
  function save(value) {
    fs.mkdirSync(path.dirname(journal), { recursive: true });
    const temporary = journal + '.' + randomUUID() + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify({ ...value, updatedAt: new Date().toISOString() }));
    fs.renameSync(temporary, journal);
  }
  function scenario(labId) {
    const lab = findLab(labId);
    if (!faultScenarios[labId] || labVmTarget(lab) !== 'client') throw cloudError('Bài này chưa hỗ trợ nạp lỗi.', 400, 'CLOUD_INVALID_SCENARIO');
    return faultScenarios[labId];
  }
  function assertAccess(labId, target) {
    const current = read();
    if (target === 'client' && ['preparing', 'resetting'].includes(current?.state)) {
      throw cloudError('CLIENT01 đang chuẩn bị/hoàn nguyên kịch bản. Vui lòng chờ.', 409, 'CLOUD_BUSY');
    }
    if (target === 'client' && current && current.state !== 'reset' && current.labId !== labId) {
      throw cloudError('CLIENT01 đang có bài nạp lỗi khác. Hoàn nguyên bài đó trước.', 409, 'CLOUD_SESSION_CONFLICT');
    }
  }
  async function run(labId, operation) {
    const result = await execute(faultCommand(scenario(labId), operation), { labId, target: 'client', lockHeld: true });
    lastProbe = { operation, exitCode: result.exitCode, timedOut: Boolean(result.timedOut) };
    return result.exitCode === 0 && !result.timedOut;
  }
  async function prepare(labId) {
    scenario(labId);
    return withVmLock('client', 'fault-prepare', async () => {
      const current = read();
      if (current && current.state !== 'reset') throw cloudError('Phiên lỗi trước chưa hoàn nguyên.', 409, 'CLOUD_SESSION_CONFLICT');
      await baseline();
      const session = { id: randomUUID(), labId, target: 'client', state: 'preparing' };
      save(session);
      try {
        if (!await run(labId, 'Baseline') || !await run(labId, 'Healthy')) throw new Error('baseline');
        if (!await run(labId, 'Inject') || !await run(labId, 'Faulted')) throw new Error('inject/probe');
        save({ ...session, state: 'active' });
        return read();
      } catch {
        save({ ...session, state: 'failed', lastProbe });
        throw cloudError('Không chuẩn bị/xác minh được sự cố. Cần phục hồi phiên trước khi thử lại.', 502, 'CLOUD_FAULT_PREPARE_FAILED');
      }
    });
  }
  async function verify(labId) {
    const current = read();
    if (!current || current.labId !== labId || !['active', 'repaired'].includes(current.state)) {
      return { supported: false, passed: false, reason: 'Chưa có sự cố đã nạp và xác minh cho bài này.' };
    }
    return withVmLock('client', 'fault-verify', async () => {
      const passed = await run(labId, 'Healthy');
      save({ ...current, state: passed ? 'repaired' : 'active' });
      return { supported: true, passed, method: 'windows-functional-probe', target: getVmTargetConfig('client').vmName,
        ...(lastProbe?.timedOut ? { timedOut: true, reason: 'Phép kiểm trên Windows chưa hoàn tất. Chưa kết luận thao tác của bạn sai; thử lại khi VM sẵn sàng.' }
          : !passed ? { reason: scenario(labId) === 'serviceconfig'
            ? lastProbe?.exitCode === 2
              ? 'Không đọc/kiểm tra được fixture dịch vụ hoặc cấu hình không hợp lệ. Kiểm tra XML, tài nguyên của bài và nhật ký; chưa coi đây là kết quả sửa lỗi đạt.'
              : 'Chưa đạt: kiểm tra service Running dưới LOCAL SERVICE, cấu hình Data, dữ liệu gốc và một phiếu xử lý mới trong Outbox. Không chỉ nhìn trạng thái Running.'
            : 'Chức năng trên Windows chưa phục hồi đúng tiêu chí. Kiểm tra lại trạng thái thực tế trong Desktop và yêu cầu của bài.' } : {}),
      };
    });
  }
  async function reset(labId) {
    const current = read();
    if (!current || current.labId !== labId || current.state === 'reset') throw cloudError('Không có phiên cần hoàn nguyên cho bài này.', 409, 'CLOUD_SESSION_CONFLICT');
    return withVmLock('client', 'fault-reset', async () => {
      save({ ...current, state: 'resetting' });
      try {
        if (!await run(labId, 'Reset')) throw new Error('reset');
        save({ ...current, state: 'reset' });
        return { ...read(), resetScope: 'scenario-owned-changes', fullVmReset: false };
      } catch {
        save({ ...current, state: 'failed', lastProbe });
        throw cloudError('Hoàn nguyên kịch bản thất bại; cần phục hồi baseline VM.', 502, 'CLOUD_FAULT_RESET_FAILED');
      }
    });
  }
  return { status: read, assertAccess, prepare, verify, reset };
}
export const windowsFaults = createWindowsFaultService();
