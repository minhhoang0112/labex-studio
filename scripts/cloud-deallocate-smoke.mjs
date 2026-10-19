import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
const base = 'http://127.0.0.1:5000';
const response = await fetch(base + '/api/cloud-vm/stop', { method: 'POST' });
assert.equal(response.status, 202);
assert.equal((await response.json()).accepted, true);
console.log('Azure accepted the real deallocate operation.');
let final;
for (let attempt = 0; attempt < 90; attempt++) {
  const status = await fetch(base + '/api/cloud-vm/status').then(value => value.json());
  if (status.operationError) throw new Error(status.operationError);
  if (status.powerStateCode === 'PowerState/deallocated' && !status.isBusy) { final = status; break; }
  await setTimeout(2000);
}
assert.ok(final, 'Azure did not confirm deallocation within the smoke timeout; check ARM before retrying.');
await fs.writeFile('.artifacts/cloud-deallocate-smoke.json', JSON.stringify({ complete: true,
  checkedAt: new Date().toISOString(), target: final.vmName, powerStateCode: final.powerStateCode,
  statusSource: final.statusSource }, null, 2));
console.log('PASS Azure ARM confirms PowerState/deallocated; no TCP-state guess.');
