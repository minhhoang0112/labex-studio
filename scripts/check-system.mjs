// Read-only health/catalog checks and unsupported grading requests only.
// Never opens, resets, or executes commands in learner containers.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.LABEX_UI_URL || 'http://127.0.0.1:5000';
const report = { checkedAt: new Date().toISOString(), checks: [] };
async function get(path) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200, path);
  return response.json();
}
const page = await fetch(base + '/learn');
assert.equal(page.status, 200);
const health = await get('/api/health');
assert.equal(health.status, 'ok');
assert.equal(health.environment.available, true);
report.environment = { label: health.environment.label, available: health.environment.available };
const catalog = await get('/api/courses');
report.courses = catalog.courses.map(course => ({ id: course.id, readiness: course.readiness,
  imported: course.imported_labs_count, runnable: course.runnable_labs_count }));
for (const id of ['win-powershell-basics', 'comptia-configure-raid-and-lvm-storage-in-linux-590842']) {
  const lab = await get('/api/labs/' + id);
  assert.equal(lab.availability.can_grade, false, id);
  assert.equal(lab.availability.can_start_terminal, false, id);
  const response = await fetch(base + '/api/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labId: id, stepId: lab.steps[0].id, command: 'pwd', passed: true }),
  });
  assert.equal(response.status, 422, id);
  assert.equal((await response.json()).passed, false, id);
  report.checks.push({ lab: id, unsupportedGradeRejected: true });
}
report.complete = true;
await fs.mkdir('.artifacts', { recursive: true });
await fs.writeFile('.artifacts/system-api-audit.json', JSON.stringify(report, null, 2));
console.log(`PASS web, health, ${catalog.total} courses; Windows/RAID cannot be graded by arbitrary commands.`);
