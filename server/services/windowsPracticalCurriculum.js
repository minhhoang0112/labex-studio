import fs from 'node:fs';

// Separate authored layer: legacy import/build scripts cannot overwrite this
// lesson format. Grading contracts and step IDs remain owned by the original lab.
const plan = JSON.parse(fs.readFileSync(new URL('../data/windows-practical-v2.json', import.meta.url), 'utf8'));

export function applyWindowsPracticalCurriculum(lab) {
  const brief = plan.lessons[lab.id] || lab.practice_ticket;
  if (!brief) return lab;
  const sections = lab.sections.map(section => ({ ...section,
    ...(section.kind !== 'summary' ? { practice_brief: {
      ...brief,
      ...(section.kind === 'document' ? { tasks: brief.diagnosis, acceptance: [
        'Nêu được triệu chứng, bằng chứng và giả thuyết trước khi sửa. Phần quan sát không tự động tính điểm.',
      ] } : {}),
    } } : {}),
  }));
  return { ...lab, sections, learning_order: brief.learning_order,
    teaching_format: 'ticket-gui-v2', teaching_revision: plan.revision,
    curriculum_group: 'Ticket thực hành GUI · đề bài và tiêu chí trước, gợi ý mở dần',
  };
}

export function compareLearningOrder(a, b) {
  return (a.learning_order ?? 1000 + (a.order ?? 999)) - (b.learning_order ?? 1000 + (b.order ?? 999)) || a.id.localeCompare(b.id);
}
