// Combine fully exercised lessons from durable runs without treating a partial
// lesson or an interrupted whole run as completed evidence.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const [planFile, outputFile, ...reportFiles] = process.argv.slice(2);
assert.ok(planFile && outputFile && reportFiles.length, "Usage: node tests/aggregate-course-smoke.mjs <plan> <output> <report>...");
const plan = JSON.parse(await fs.readFile(planFile, "utf8"));
const sources = [];
const completed = new Map();
for (const file of reportFiles) {
  const report = JSON.parse(await fs.readFile(file, "utf8"));
  if (path.normalize(report.plan) !== path.normalize(planFile)) {
    // A saved resume plan is allowed only when every selected lesson is an
    // exact subset of the canonical scenario, including actions and task IDs.
    // A source_plan label alone is not evidence of compatibility.
    const subset = JSON.parse(await fs.readFile(report.plan, "utf8"));
    assert.equal(path.normalize(subset.source_plan || ""), path.normalize(planFile), `Different scenario plan in ${file}`);
    const ids = new Set();
    for (const lesson of subset.lessons) {
      assert.ok(!ids.has(lesson.lab_id), `Duplicate resumed lesson in ${report.plan}`);
      ids.add(lesson.lab_id);
      assert.deepEqual(lesson, plan.lessons.find(item => item.lab_id === lesson.lab_id), `Changed resumed lesson in ${report.plan}`);
    }
  }
  const acceptedLessons = [];
  for (const lesson of plan.lessons) {
    const records = report.tasks.filter((task) => task.labId === lesson.lab_id);
    const expected = lesson.steps.map((step) => step.id).sort();
    if (records.length !== expected.length || new Set(records.map((task) => task.stepId)).size !== expected.length) continue;
    if (JSON.stringify(records.map((task) => task.stepId).sort()) !== JSON.stringify(expected)) continue;
    assert.ok(records.every((task) => task.passed === true || task.blockedAsExpected === true), `Unproven task in ${file}`);
    for (const task of records) {
      const scenario = lesson.steps.find((step) => step.id === task.stepId);
      assert.equal(task.blockedAsExpected === true, scenario.unsupported === true || (scenario.allow_missing_capabilities === true && task.passed !== true));
      assert.ok(task.testEnvironment.startsWith(`source-smoke-${report.runId}-`));
    }
    completed.set(lesson.lab_id, { report: file, records });
    acceptedLessons.push(lesson.lab_id);
  }
  sources.push({ file, runId: report.runId, wholeRunComplete: report.complete, acceptedFullyExercisedLessons: acceptedLessons,
    hostAccountFinalCheckCompleted: report.hostAccountsUnchanged === true });
}
const missing = plan.lessons.filter((lesson) => !completed.has(lesson.lab_id)).map((lesson) => lesson.lab_id);
assert.deepEqual(missing, [], "Some lessons have no complete integration evidence");
const tasks = plan.lessons.flatMap((lesson) => completed.get(lesson.lab_id).records.map((task) => ({ ...task, sourceReport: completed.get(lesson.lab_id).report })));
assert.equal(tasks.length, plan.expected_tasks ?? plan.lessons.reduce((count, lesson) => count + lesson.steps.length, 0));
const result = { version: 1, coverageComplete: true, singleUninterruptedRun: false, plan: planFile,
  generatedAt: new Date().toISOString(), lessons: plan.lessons.length, passedTasks: tasks.filter((task) => task.passed).length,
  blockedTasks: tasks.filter((task) => task.blockedAsExpected).length,
  provenance: "Only whole lessons with every scenario task recorded are accepted; interrupted runs contribute completed lessons, never partial lessons.",
  hostAccountEvidence: "Per-source final checks are recorded individually; an interrupted run is not claimed to have completed its final check.",
  sources, tasks };
await fs.writeFile(outputFile, JSON.stringify(result, null, 2) + "\n");
console.log(`Coverage verified: ${result.lessons} lessons, ${result.passedTasks} passed tasks, ${result.blockedTasks} explicit blocks. ${outputFile}`);
