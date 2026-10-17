const KEY = 'labex.local.progress.v2';

export function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function labProgress(labId) {
  const entry = readProgress()[labId];
  return entry && typeof entry === 'object' ? entry : { passed: [], currentSectionId: null };
}

function taskIds(lab) {
  return [...new Set(Array.isArray(lab?.step_ids)
    ? lab.step_ids
    : (lab?.steps || []).map(step => step.id))];
}

export function validPassedSteps(lab, entry = labProgress(lab?.id)) {
  const valid = new Set(taskIds(lab));
  return [...new Set(Array.isArray(entry?.passed) ? entry.passed : [])].filter(id => valid.has(id));
}

export function saveProgress(lab, currentSectionId, passedStepId) {
  if (!lab?.id) return { passed: [], currentSectionId: null, complete: false };
  const all = readProgress();
  const previous = labProgress(lab.id);

  // Valid step ids (tasks that need verification)
  const validTaskIds = new Set(
    Array.isArray(lab.step_ids) && lab.step_ids.length
      ? lab.step_ids
      : Array.isArray(lab.steps)
      ? lab.steps.map(s => s.id)
      : []
  );

  const prevPassed = Array.isArray(previous.passed) ? previous.passed : [];
  const candidatePassed = passedStepId != null ? [...prevPassed, passedStepId] : prevPassed;
  // Always filter passed IDs strictly against current valid step_ids
  const passed = [...new Set(candidatePassed)].filter(id => validTaskIds.has(id));

  const totalTasks = validTaskIds.size;
  const complete = totalTasks > 0 && passed.length === totalTasks;

  all[lab.id] = {
    courseId: lab.course_id,
    currentSectionId: currentSectionId ?? previous.currentSectionId,
    passed,
    total: totalTasks,
    complete
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* Storage is optional/quota full */
  }

  window.dispatchEvent(new Event('labex-progress'));
  return all[lab.id];
}

export function unmarkProgressStep(lab, stepId) {
  if (!lab?.id || !stepId) return labProgress(lab?.id);
  const all = readProgress();
  const previous = labProgress(lab.id);
  const prevPassed = Array.isArray(previous.passed) ? previous.passed : [];
  const passed = validPassedSteps(lab, { passed: prevPassed }).filter(id => id !== stepId);
  const totalTasks = taskIds(lab).length;
  const complete = totalTasks > 0 && passed.length === totalTasks;

  all[lab.id] = {
    ...previous,
    passed,
    complete
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}

  window.dispatchEvent(new Event('labex-progress'));
  return all[lab.id];
}

export function resetLocalLabProgress(labId) {
  if (!labId) return;
  const all = readProgress();
  if (all[labId]) {
    delete all[labId];
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* Optional */
    }
    window.dispatchEvent(new Event('labex-progress'));
  }
}

export function isLabCompleted(lab, entry) {
  if (!lab || !entry) return false;
  const stepIds = taskIds(lab);
  if (!stepIds.length) return false;
  const passedSet = new Set(Array.isArray(entry.passed) ? entry.passed : []);
  return stepIds.every(id => passedSet.has(id));
}

export function courseProgress(courseId, labs = []) {
  const all = readProgress();
  // Current curriculum definitions are required; stored complete flags and old
  // IDs alone cannot establish completion after the curriculum changes.
  return labs.filter(lab => lab && typeof lab === 'object' &&
    (!lab.course_id || lab.course_id === courseId) && isLabCompleted(lab, all[lab.id])).length;
}
