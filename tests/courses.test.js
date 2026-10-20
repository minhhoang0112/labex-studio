import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import coursesRouter from "../server/routes/courses.js";

test("the learner receives a complete ordered Linux syllabus and accurate catalog counts", async (t) => {
  const app = express();
  app.use("/api", coursesRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const catalog = await fetch(`${base}/courses?topic=linux`).then(r => r.json());
  assert.ok(catalog.total >= 2);
  for (const course of catalog.courses) {
    const detail = await fetch(`${base}/courses/${course.id}`).then(r => r.json());
    assert.equal(course.labs_count, detail.labs.filter(lab => lab.availability.can_open).length);
    assert.equal(course.steps_count, detail.labs.reduce((n, lab) => n + lab.steps_count, 0));
  }
  const quick = await fetch(`${base}/courses/quick-start-with-linux`).then(r => r.json());
  assert.equal(quick.labs[0].id, "linux-your-first-linux-lab");
  assert.equal(quick.labs.at(-1).id, "linux-the-jokers-trick");
  assert.equal(quick.labs.filter(lab => lab.type === "lab").length, 5);
  assert.equal(quick.labs.filter(lab => lab.type === "challenge").length, 5);
  assert.equal(quick.labs.reduce((sum, lab) => sum + lab.sections_count, 0), 67);
  assert.equal(quick.course.steps_count, 47);
  const reference = await fetch(`${base}/courses/quick-start-with-linux/reference`).then(r => r.json());
  for (const item of quick.labs) {
    const publicLab = await fetch(`${base}/labs/${item.id}`).then(r => r.json());
    const original = reference.lessons.find(l => Number(l.source_lab_id) === Number(publicLab.source_lab_id));
    assert.ok(original, `source reference for ${item.id}`);
    assert.deepEqual(publicLab.sections.map(s => s.title), original.sections.map(s => s.title));
    assert.deepEqual(publicLab.sections.filter(s => s.kind === "task").map(s => s.id), publicLab.steps.map(s => s.id));
    assert.ok([...publicLab.steps, ...publicLab.sections].every(s => !Object.hasOwn(s, "verification") && !Object.hasOwn(s, "verify_command") && !Object.hasOwn(s, "verification_by_provider")));
  }
  const lab = await fetch(`${base}/labs/${quick.labs[0].id}`).then(r => r.json());
  assert.ok(lab.steps.every(step => step.task && !Object.hasOwn(step, "verify_command")));
  assert.equal((await fetch(`${base}/labs/does-not-exist`)).status, 404);
  assert.equal((await fetch(`${base}/courses?q=linux&q=docker`)).status, 400);
  const roadmap = await fetch(`${base}/roadmaps/linux-system-administrator`).then(r => r.json());
  assert.equal(roadmap.totals.source_courses, 8);
  assert.equal(roadmap.totals.source_labs, 325);
  assert.equal(roadmap.order_kind, "recommended-local");
  assert.equal(roadmap.source_order[1], "become-a-junior-system-administrator");
  assert.equal(roadmap.courses[1].id, "linux-for-noobs");
  assert.ok(roadmap.courses.every(course => course.learning_outcomes.length && course.practice_strategy && Array.isArray(course.prerequisite_skills)));
  const noobs = await fetch(`${base}/courses/linux-for-noobs`).then(r => r.json());
  assert.equal(noobs.labs.length, 37);
  assert.equal(noobs.course.imported_labs_count, 37);
  assert.equal((await fetch(`${base}/labs/${noobs.labs[0].id}`)).status, 200);

  const shell = await fetch(`${base}/courses/shell-for-beginners`).then(r => r.json());
  assert.equal(shell.labs.length, 18);
  assert.equal(shell.course.imported_labs_count, 18);
  assert.equal((await fetch(`${base}/labs/${shell.labs[0].id}`)).status, 200);

  const pending = await fetch(`${base}/courses/comptia-linux-plus-training-labs`).then(r => r.json());
  assert.equal(pending.labs.length, 33);
  assert.equal(pending.course.imported_labs_count, 33);
  assert.equal((await fetch(`${base}/labs/${pending.labs[0].id}`)).status, 200);
  const legacy = await fetch(`${base}/labs/linux-practice-log-analysis`).then(r => r.json());
  assert.ok(legacy.sections.every(section => section.kind === "task"));
  const junior = await fetch(base + "/labs/linux-day-6-the-process-overseer-596618").then(r => r.json());
  assert.ok([...junior.steps, ...junior.sections].every(section =>
    !Object.hasOwn(section, "verification") && !Object.hasOwn(section, "verification_by_provider")));
  // The imported source course stays separate from the four local exercises.
  const commands = await fetch(`${base}/courses/linux-basic-commands-practice-online`).then(r => r.json());
  assert.equal(commands.labs.length, 41);
  assert.equal(commands.course.imported_labs_count, 41);
  assert.equal(commands.course.steps_count, 181);
  assert.equal(commands.labs.reduce((sum, lesson) => sum + lesson.sections_count, 0), 263);
  assert.equal(roadmap.courses.find(course => course.id === "linux-basic-commands-practice-online").imported_labs_count, 41);
  const commandsReference = await fetch(`${base}/courses/linux-basic-commands-practice-online/reference`).then(r => r.json());
  for (const item of commands.labs) {
    const lesson = await fetch(`${base}/labs/${item.id}`).then(r => r.json());
    const outline = commandsReference.lessons.find(ref => ref.source_lab_id === lesson.source_lab_id);
    assert.deepEqual(lesson.sections.map(section => section.title), (outline.sections || outline.outline.sections).map(section => section.title));
    assert.ok(lesson.sections.every(section => section.content_vi && section.title_vi));
    assert.ok(lesson.steps.every(step => step.grading && !Object.hasOwn(step, "verification")));
  }
  const challenges = await fetch(`${base}/courses/linux-practice-challenges`).then(r => r.json());
  assert.equal(challenges.labs.length, 156);
  assert.equal(challenges.course.imported_labs_count, 33);
  assert.equal(challenges.labs.filter(item => item.reused).length, 4);
  assert.equal(roadmap.totals.unique_imported_labs, 185);
  assert.equal(roadmap.totals.imported_labs, 189);
  const sharedId = "linux-add-new-user-and-group-17987";
  assert.ok(challenges.labs.some(item => item.id === sharedId && item.reused));
  const shared = await fetch(`${base}/labs/${sharedId}?courseId=linux-practice-challenges`).then(r => r.json());
  assert.equal(shared.course_id, "linux-practice-challenges");
  assert.equal(shared.primary_course_id, "linux-for-noobs");
  assert.deepEqual(shared.steps.map(step => step.id), challenges.labs.find(item => item.id === sharedId).step_ids);
  assert.equal((await fetch(`${base}/labs/${sharedId}?courseId=shell-for-beginners`)).status, 400);
});
