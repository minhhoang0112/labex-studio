const assert = require('assert/strict');

async function test() {
  const base = 'http://localhost:5000/api';
  const labId = 'linux-display-user-and-group-information';
  const step1 = 'source-8718-section-1'; // whoami
  const step2 = 'source-8718-section-2'; // id

  // 1. Reset lab clean
  await fetch(`${base}/labs/${labId}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmReset: true })
  });

  // 2. Check step 1 when no commands typed yet -> MUST FAIL
  const r1 = await fetch(`${base}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labId, stepId: step1 })
  }).then(r => r.json());
  console.log('Test 1 (no commands typed):', { passed: r1.passed, message: r1.message });
  assert.equal(r1.passed, false, 'Step 1 must fail when no commands typed');

  // 3. Check step 2 when no commands typed yet -> MUST FAIL
  const r2 = await fetch(`${base}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labId, stepId: step2 })
  }).then(r => r.json());
  console.log('Test 2 (no commands typed):', { passed: r2.passed, message: r2.message });
  assert.equal(r2.passed, false, 'Step 2 must fail when no commands typed');

  console.log('All verification truthfulness tests passed successfully!');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

