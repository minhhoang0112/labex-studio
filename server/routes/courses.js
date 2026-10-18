import express from "express";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { isValidId, listLabs, loadLab } from "../data/catalog.js";
import { getLinuxRoadmap, readLinuxIndex, readLinuxOutlines, courseReadiness, listCourseLabs } from "../services/linuxRoadmap.js";
import { getLabReadiness, getStepReadiness } from "../services/readiness.js";
import { getVerificationDefinition } from "../services/verification.js";

const router = express.Router();
const readData = (file) => JSON.parse(fs.readFileSync(fileURLToPath(new URL(`../data/${file}`, import.meta.url)), "utf8"));

function publicPath(path) {
  if (path.alias !== "linux") return path;
  const courses = getCourses();
  const index = readLinuxIndex();
  const local = index.courses.map(source => courses.find(course => course.id === source.id));
  const { followers_count, hours, ...metadata } = path;
  return { ...metadata, has_cert: false, source_url: index.source_url, source_observed_at: index.observed_at,
    source_statistics: { followers_count, hours, labs_count: path.labs_count, has_cert: path.has_cert },
    course_count: index.courses.length, source_labs_count: index.courses.reduce((n, c) => n + c.source_labs_count, 0),
    labs_count: local.reduce((n, c) => n + (c?.imported_labs_count || 0), 0),
    runnable_labs_count: local.reduce((n, c) => n + (c?.runnable_labs_count || 0), 0),
    roadmap_url: "/api/roadmaps/linux-system-administrator",
    levels: path.levels.map(level => ({ ...level, courses: level.courses.map(course => {
      const current = courses.find(item => item.id === course.alias);
      const { user_count, has_cert, ...source } = course;
      return { ...source, ...(current || {}), id: current?.id || course.alias, numeric_id: course.id,
        has_cert: false, source_statistics: { user_count, has_cert },
        ...(current ? {} : { available: false, readiness: "reference-only", labs_count: 0, imported_labs_count: 0, runnable_labs_count: 0 }) };
    }) })) };
}

export function getCourses() {
  const labs = listLabs();
  const index = readLinuxIndex();
  return readData("courses.json").map((course) => {
    const available = listCourseLabs(course.id, labs, index);
    const source = index.courses.find(item => item.id === course.id);
    const readiness = courseReadiness(course.id, labs, index);
    const { user_count, rating, has_cert, ...metadata } = course;
    return { ...metadata, level: typeof course.level === "number" ? course.level : ({ beginner: 1, intermediate: 2, advanced: 3 }[String(course.level).toLowerCase()] || 1),
      level_label: course.level_label || (typeof course.level === "string" ? course.level : "Beginner"),
      cover: course.cover || course.cover_image, skills: course.skills || [], tags: course.tags || [],
      ...(course.id === "quick-start-with-linux" ? { description: "Làm quen Linux qua terminal, thao tác tệp, đọc và so sánh nội dung, quyền sở hữu và quản lý tài khoản." } : {}),
      ...(course.id === "linux-commands-practice-online" ? { name: "Linux Commands Practice — Local Exercises", source_equivalent: false } : {}),
      has_cert: false, source_statistics: { user_count, rating, has_cert },
      source_url: source?.source_url, source_labs_count: source?.source_labs_count ?? null, ...readiness,
      readiness: available.length && readiness.runnable_labs_count === available.length ? "ready"
        : available.length ? "partial" : "reference-only",
      labs_count: available.length, available: readiness.practice_labs_count > 0,
      lab_ids: available.map((lab) => lab.id),
      steps_count: available.reduce((sum, lab) => sum + lab.steps.length, 0) };
  });
}

router.get("/roadmaps/linux-system-administrator", (_req, res, next) => {
  try { res.json(getLinuxRoadmap()); } catch (error) { next(error); }
});

router.get("/topics", (_req, res, next) => {
  try { res.json(readData("topics.json")); } catch (error) { next(error); }
});
router.get("/paths", (_req, res, next) => {
  try {
    const paths = readData("paths.json").map(publicPath);
    res.json({ total: paths.length, paths });
  } catch (error) { next(error); }
});
router.get("/paths/:alias", (req, res, next) => {
  try {
    const paths = readData("paths.json");
    const path = paths.find((p) => p.alias === req.params.alias || String(p.id) === req.params.alias);
    if (!path) return res.status(404).json({ error: "Không tìm thấy lộ trình học." });
    res.json(publicPath(path));
  } catch (error) { next(error); }
});
router.get("/courses", (req, res, next) => {
  try {
    const { topic, q, level } = req.query;
    if ([topic, q, level].some((value) => value !== undefined && typeof value !== "string")) {
      return res.status(400).json({ error: "Bộ lọc không hợp lệ." });
    }
    let courses = getCourses();
    if (topic && topic !== "all") {
      const searchTopic = topic.toLowerCase();
      courses = courses.filter((course) => course.topic === searchTopic || course.tags?.some((tag) => tag.toLowerCase() === searchTopic));
    }
    if (q?.trim()) {
      const query = q.trim().toLowerCase();
      courses = courses.filter((course) => [course.name, course.description, ...course.skills, ...course.tags].join(" ").toLowerCase().includes(query));
    }
    if (level) courses = courses.filter((course) => String(course.level) === level);
    res.json({ total: courses.length, courses });
  } catch (error) { next(error); }
});
router.get("/courses/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Mã khóa học không hợp lệ." });
    const course = getCourses().find((item) => item.id === req.params.id || item.alias === req.params.id);
    if (!course) return res.status(404).json({ error: "Không tìm thấy khóa học." });
    const imported = listCourseLabs(course.id).sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id));
    const summary = lab => {
      const { id, title, title_vi, difficulty, estimated_time, overview, steps, sections, order, type, source, source_lab_id, source_url } = lab;
      return {
        id, title, title_vi, difficulty, estimated_time, overview, order, type,
        source, source_lab_id, source_url, availability: getLabReadiness(lab), sections_count: sections?.length || steps.length,
        steps_count: steps.length, step_ids: steps.map((step) => step.id),
      };
    };
    const sourceCourse = readLinuxIndex().courses.find(item => item.id === course.id);
    const outlines = sourceCourse ? readLinuxOutlines() : null;
    const stages = sourceCourse?.stages.map(stage => ({ name: stage.name, labs: stage.labs.map(item => {
      const local = imported.find(lab => Number(lab.source_lab_id) === item.source_lab_id);
      const outline = outlines.lessons.find(lab => lab.source_lab_id === item.source_lab_id);
      return local ? { ...summary(local), order: item.order, type: item.type,
        primary_course_id: local.course_id, reused: local.course_id !== course.id } : { id: item.alias, title: item.title, order: item.order, type: item.type,
        source_lab_id: item.source_lab_id, source_url: item.source_url, difficulty: item.difficulty,
        source_sections_count: outline?.sections?.length || 0, source_steps_count: outline?.sections?.filter(s => s.need_verify).length || 0,
        estimated_time: `${item.estimated_minutes} mins`, steps_count: 0, step_ids: [], sections_count: 0,
        availability: { state: "reference-only", can_open: false, can_start_terminal: false, can_grade: false,
          supported_steps_count: 0, total_steps_count: null, missing_capabilities: [],
          reasons: ["Đã có giáo trình nguồn; hướng dẫn và bộ kiểm tra local chưa được triển khai."] } };
    }) }));
    res.json({ course, labs: stages ? stages.flatMap(stage => stage.labs) : imported.map(summary), ...(stages ? { stages } : {}) });
  } catch (error) { next(error); }
});
router.get("/courses/:id/reference", (req, res, next) => {
  try {
    if (req.params.id === "quick-start-with-linux") return res.json(readData("reference/quick-start-live-outline.json"));
    const index = readLinuxIndex();
    const course = index.courses.find(item => item.id === req.params.id);
    if (!course) return res.status(404).json({ error: "Chưa có đối chiếu nguồn cho khóa học này." });
    const outlines = readLinuxOutlines();
    res.json({ observed_at: index.observed_at, ...course, lessons: course.stages.flatMap(stage => stage.labs).map(lab => ({ ...lab,
      outline: outlines.lessons.find(item => item.source_lab_id === lab.source_lab_id) || null })) });
  } catch (error) { next(error); }
});
router.get("/labs/:id/reference", (req, res, next) => {
  try {
    const index = readLinuxIndex();
    const lab = index.courses.flatMap(course => course.stages.flatMap(stage => stage.labs)).find(item => item.alias === req.params.id || String(item.source_lab_id) === req.params.id);
    const local = isValidId(req.params.id) ? loadLab(req.params.id) : null;
    const sourceId = lab?.source_lab_id || local?.source_lab_id;
    const outline = readLinuxOutlines().lessons.find(item => item.source_lab_id === sourceId);
    if (!outline) return res.status(404).json({ error: "Không tìm thấy cấu trúc bài nguồn." });
    res.json({ ...(lab || {}), observed_at: index.observed_at, outline });
  } catch (error) { next(error); }
});
router.get("/labs/:id", (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Mã bài lab không hợp lệ." });
    const lab = loadLab(req.params.id);
    if (!lab) {
      const reference = readLinuxIndex().courses.flatMap(course => course.stages.flatMap(stage => stage.labs)).find(item => item.alias === req.params.id);
      if (reference) return res.status(409).json({ error: "Bài này mới có trong giáo trình nguồn, chưa có nội dung thực hành local.",
        availability: "reference-only", source_url: reference.source_url });
      return res.status(404).json({ error: "Không tìm thấy bài lab." });
    }
    const memberships = readLinuxIndex().courses.filter(course => course.stages.some(stage =>
      stage.labs.some(item => item.source_lab_id === Number(lab.source_lab_id)))).map(course => course.id);
    const courseIds = [...new Set([lab.course_id, ...memberships])];
    const requestedCourse = req.query.courseId;
    if (requestedCourse !== undefined && (typeof requestedCourse !== "string" || !courseIds.includes(requestedCourse))) {
      return res.status(400).json({ error: "Bài thực hành không thuộc khóa học được chọn." });
    }
    const publicSection = ({ verify_command, verification, verification_by_provider, ...section }, task = false) => ({
      ...section, kind: section.kind || (task ? "task" : undefined),
      ...((verification || verification_by_provider) ? { verification_kind: getVerificationDefinition({ verify_command, verification, verification_by_provider })?.kind } : {}),
      ...((section.kind === "task" || task) ? { grading: getStepReadiness({ ...section, verify_command, verification, verification_by_provider }, lab) } : {}),
    });
    res.json({ ...lab, course_id: requestedCourse || lab.course_id, primary_course_id: lab.course_id, course_ids: courseIds,
      availability: getLabReadiness(lab), steps: lab.steps.map(step => publicSection(step, true)),
      sections: (lab.sections || lab.steps).map(section => publicSection(section, !lab.sections)) });
  } catch (error) { next(error); }
});
export default router;
