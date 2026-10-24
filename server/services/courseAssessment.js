import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const bankFile = new URL('../data/assessments/quick-start-linux-final.json', import.meta.url);
export function readAssessmentBank() { return JSON.parse(fs.readFileSync(bankFile, 'utf8')); }
export function assessmentSummary(bank = readAssessmentBank()) {
  return {id: bank.id, course_id: bank.course_id, order: bank.order, title: bank.title, version: bank.version,
    provenance: bank.provenance, pass_percent: bank.pass_percent, question_count: bank.groups.reduce((n, g) => n + g.questions.length, 0),
    covered_labs: bank.groups.map(g => ({lab_id: g.lab_id, title: g.title, question_count: g.questions.length})),
    url: `/assessments/${bank.id}`};
}
const fail = (status, message) => { throw Object.assign(new Error(message), {status}); };
const digest = bank => crypto.createHash('sha256').update(JSON.stringify(bank)).digest('hex');
function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

export function createAssessmentService({directory = fileURLToPath(new URL('../runtime/state/assessments/', import.meta.url)), readBank = readAssessmentBank} = {}) {
  function filename(id) {
    if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)) fail(400, 'Mã lượt kiểm tra không hợp lệ.');
    return path.join(directory, `${id}.json`);
  }
  function save(attempt) {
    fs.mkdirSync(directory, {recursive: true});
    const file = filename(attempt.id), temp = `${file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(attempt), {mode: 0o600});
    fs.renameSync(temp, file);
  }
  function read(id) {
    const file = filename(id);
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') fail(404, 'Không tìm thấy lượt kiểm tra. Hãy bắt đầu lượt mới.'); throw error; }
  }
  function current(attempt, bank) {
    if (attempt.revision !== digest(bank)) fail(409, 'Bộ câu hỏi đã được cập nhật. Hãy bắt đầu lượt mới để được chấm đúng phiên bản.');
  }
  function publicAttempt(attempt, bank) {
    const questions = bank.groups.flatMap(g => g.questions);
    return {id: attempt.id, assessment: assessmentSummary(bank), started_at: attempt.started_at, answers: attempt.answers,
      submitted_at: attempt.submitted_at || null, result: attempt.result || null,
      questions: questions.map(q => ({id: q.id, lab_id: q.lab_id, skill: q.skill, prompt: q.prompt,
        options: attempt.option_order[q.id].map(id => q.options.find(option => option.id === id))}))};
  }
  function validateAnswers(answers, bank) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) fail(400, 'Đáp án phải là một đối tượng câu hỏi và lựa chọn.');
    const questions = new Map(bank.groups.flatMap(g => g.questions).map(q => [q.id, q]));
    if (Object.keys(answers).length > questions.size) fail(400, 'Quá nhiều đáp án.');
    for (const [id, value] of Object.entries(answers)) {
      const q = questions.get(id);
      if (!q || typeof value !== 'string' || !q.options.some(o => o.id === value)) fail(400, 'Có câu hỏi hoặc lựa chọn không hợp lệ.');
    }
    return {...answers};
  }
  return {
    summary: () => assessmentSummary(readBank()),
    start(assessmentId) {
      const bank = readBank();
      if (assessmentId !== bank.id) fail(404, 'Chưa có bài kiểm tra này.');
      const attempt = {id: crypto.randomBytes(16).toString('hex'), assessment_id: bank.id, revision: digest(bank),
        started_at: new Date().toISOString(), answers: {},
        option_order: Object.fromEntries(bank.groups.flatMap(g => g.questions).map(q => [q.id, shuffled(q.options.map(o => o.id))]))};
      save(attempt);
      return publicAttempt(attempt, bank);
    },
    get(id) { const attempt = read(id), bank = readBank(); current(attempt, bank); return publicAttempt(attempt, bank); },
    update(id, answers) {
      const attempt = read(id), bank = readBank(); current(attempt, bank);
      if (attempt.result) fail(409, 'Lượt này đã nộp. Hãy làm lượt mới nếu muốn trả lời lại.');
      attempt.answers = validateAnswers(answers, bank); save(attempt);
      return {saved: true};
    },
    submit(id, answers) {
      const attempt = read(id), bank = readBank(); current(attempt, bank);
      // Synchronous read/score/atomic save also makes repeated/concurrent
      // submissions idempotent in this single-process local server.
      if (attempt.result) return publicAttempt(attempt, bank);
      attempt.answers = validateAnswers(answers, bank);
      const questions = bank.groups.flatMap(g => g.questions);
      const reviews = questions.map(q => ({id: q.id, lab_id: q.lab_id, prompt: q.prompt, skill: q.skill,
        selected_option_id: attempt.answers[q.id] || null, correct_option_id: q.correct_option_id,
        correct: attempt.answers[q.id] === q.correct_option_id, explanation: q.explanation}));
      const correct = reviews.filter(q => q.correct).length, total = questions.length;
      const percent = Math.round(correct * 10000 / total) / 100;
      attempt.result = {correct, total, answered: Object.keys(attempt.answers).length, unanswered: total - Object.keys(attempt.answers).length,
        percent, score_out_of_10: Math.round(correct * 100 / total) / 10,
        passed: correct * 100 >= bank.pass_percent * total,
        groups: bank.groups.map(g => ({lab_id: g.lab_id, title: g.title, total: g.questions.length,
          correct: reviews.filter(q => q.lab_id === g.lab_id && q.correct).length})), reviews};
      attempt.submitted_at = new Date().toISOString(); save(attempt);
      return publicAttempt(attempt, bank);
    },
  };
}
