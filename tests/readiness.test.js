import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getStepReadiness, getLabReadiness } from '../server/services/readiness.js';
import { getVerificationDefinition, verifyDefinition } from '../server/services/verification.js';

const load = id => JSON.parse(fs.readFileSync(new URL(`../server/data/labs/${id}.json`, import.meta.url), 'utf8'));
function withProvider(provider, action) {
  const previous = process.env.LABEX_RUNTIME_PROVIDER;
  process.env.LABEX_RUNTIME_PROVIDER = provider;
  try { return action(); }
  finally {
    if (previous === undefined) delete process.env.LABEX_RUNTIME_PROVIDER;
    else process.env.LABEX_RUNTIME_PROVIDER = previous;
  }
}

test('namespace does not advertise Docker-only capabilities; no nested Docker or Windows claim', () => {
  const step = { verification: { kind: 'commands', groups: [['^pwd$']] } };
  withProvider('namespace', () => {
    for (const capability of ['package_management', 'persistent_processes', 'firewall', 'cron_scheduler', 'network', 'docker', 'windows']) {
      const result = getStepReadiness({ ...step, required_capabilities: [capability] });
      assert.equal(result.ready, false, capability);
      assert.deepEqual(result.missing_capabilities, [capability]);
    }
    assert.equal(getStepReadiness(step).ready, true);
  });
  withProvider('docker', () => {
    assert.equal(getStepReadiness({ ...step, required_capabilities: ['docker'] }).ready, false);
    const windows = getLabReadiness(load('win-powershell-basics'));
    assert.equal(windows.can_start_terminal, false);
    assert.equal(windows.can_grade, false);
    assert.ok(windows.missing_capabilities.includes('windows'));
  });
});

test('unsupported Noobs work cannot pass through unrelated or failed shell commands', async () => {
  const examples = [
    ['linux-basic-file-operations-in-linux-18001', 7, 'cd /home/labex/project', 0],
    ['linux-system-information-and-process-management-725419', 7, 'uname', 0],
    ['linux-remote-access-and-file-transfer-with-ssh-725416', 2, 'ssh missing-host', 255],
    ['linux-file-system-and-disk-management-17999', 4, 'mkdir /tmp/demo', 0],
    ['linux-managing-services-and-system-logs-725415', 2, 'cat /etc/hosts', 0],
  ];
  for (const [id, section, command, status] of examples) {
    const lab = load(id);
    const step = lab.steps.find(item => item.id === `source-${lab.source_lab_id}-section-${section}-v3`);
    assert.ok(step, id);
    const rule = getVerificationDefinition(step, 'docker');
    const result = await verifyDefinition(id, rule, {
      readHistory: async () => [{ command, status, user: 'labex' }],
      runCommand: async () => ({ exitCode: 0, timedOut: false }),
    });
    assert.equal(result.passed, false, `${id}: ${command}`);
  }
});
