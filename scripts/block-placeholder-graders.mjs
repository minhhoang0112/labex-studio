// Imported instructions are retained; unknown practical checks stay unsupported.
import fs from 'node:fs';
import { isUnboundedCommandPattern } from '../server/services/verification.js';
const labs = new URL('../server/data/labs/', import.meta.url);
const backup = new URL('../.artifacts/grading-before-repair-2026-10-19/', import.meta.url);
const reason = 'Đã có tài liệu, nhưng chưa có bộ kiểm tra thực hành được kiểm chứng cho nhiệm vụ này. Không thể chấm đạt bằng lệnh bất kỳ.';
function repair(rule) {
  if (!rule || typeof rule !== 'object') return rule;
  if (rule.kind === 'commands' && rule.groups?.some(group => group.some(isUnboundedCommandPattern))) {
    return { kind: 'unsupported', reason };
  }
  if (rule.kind === 'all') return { ...rule, checks: rule.checks.map(repair) };
  return rule;
}
let files = 0, tasks = 0;
for (const file of fs.readdirSync(labs).filter(name => name.endsWith('.json'))) {
  const target = new URL(file, labs);
  const original = fs.readFileSync(target, 'utf8');
  const lab = JSON.parse(original);
  for (const item of [...(lab.steps || []), ...(lab.sections || [])]) {
    const previous = JSON.stringify(item);
    if(lab.id==='linux-day-3-the-log-investigator-596202' && item.id==='source-596202-section-2-v2') {
      const definition={kind:'unsupported',reason:'Bài yêu cầu dmesg và kernel log thật; container chưa cấp kernel log riêng. Chỉ tạo boot_issues.txt không chứng minh đã đọc log.'};
      item.verification=definition;
      for(const provider of Object.keys(item.verification_by_provider||{}))item.verification_by_provider[provider]=definition;
    }
    if (item.verification) item.verification = repair(item.verification);
    for (const provider of Object.keys(item.verification_by_provider || {})) {
      item.verification_by_provider[provider] = repair(item.verification_by_provider[provider]);
    }
    if (JSON.stringify(item) !== previous && lab.steps?.includes(item)) tasks++;
  }
  const updated = JSON.stringify(lab, null, 2) + '\n';
  if (JSON.stringify(JSON.parse(original)) === JSON.stringify(lab)) continue;
  fs.mkdirSync(backup, { recursive: true });
  const copy = new URL(file, backup);
  if (!fs.existsSync(copy)) fs.writeFileSync(copy, original);
  fs.writeFileSync(target, updated);
  files++;
}
console.log(`Blocked placeholder grading in ${tasks} tasks / ${files} labs; lesson text retained.`);
