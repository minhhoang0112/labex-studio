import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { listLabs } from "../data/catalog.js";
import { getLabReadiness } from "./readiness.js";

export const readLinuxIndex = () => JSON.parse(fs.readFileSync(fileURLToPath(new URL("../data/reference/linux-course-index.json", import.meta.url)), "utf8"));
export const readLinuxOutlines = () => JSON.parse(fs.readFileSync(fileURLToPath(new URL("../data/reference/linux-section-outlines.json", import.meta.url)), "utf8"));
const NAMES = {
  "quick-start-with-linux": "Quick Start with Linux", "linux-for-noobs": "Linux for Noobs",
  "linux-basic-commands-practice-online": "Linux Commands Practice Online", "shell-for-beginners": "Shell for Beginners",
  "become-a-junior-system-administrator": "Become a Junior System Administrator",
  "comptia-linux-plus-training-labs": "CompTIA Linux+ Certification Training Labs",
  "linux-security-for-devsecops": "Linux Security for DevSecOps", "linux-practice-challenges": "Linux Practice Challenges",
};
const ORDER = ["quick-start-with-linux", "linux-for-noobs", "linux-basic-commands-practice-online", "shell-for-beginners", "become-a-junior-system-administrator", "comptia-linux-plus-training-labs", "linux-security-for-devsecops", "linux-practice-challenges"];
const PREREQUISITES = [[], [ORDER[0]], [ORDER[0]], [ORDER[1]], [ORDER[1], ORDER[3]], [ORDER[4]], [ORDER[4]], [ORDER[0]]];
const GUIDANCE = {
  "quick-start-with-linux": {
    prerequisite_skills: [],
    learning_outcomes: ["Sử dụng terminal và điều hướng thư mục", "Thao tác tệp, quyền sở hữu và tài khoản Linux"],
    practice_strategy: "Bắt đầu tại đây; tự gõ lệnh rồi làm các challenge để kiểm tra lại kiến thức.",
  },
  "linux-for-noobs": {
    prerequisite_skills: ["Điều hướng thư mục", "Lệnh thao tác tệp cơ bản"],
    learning_outcomes: ["Quản lý tệp, môi trường shell và dữ liệu văn bản", "Làm quen tiến trình, phần mềm, mạng và tự động hóa"],
    practice_strategy: "Học theo năm chặng của khóa; xem khả năng hỗ trợ từng task trước khi làm phần quản trị dịch vụ.",
  },
  "linux-basic-commands-practice-online": {
    prerequisite_skills: ["Đọc hướng dẫn lệnh Linux", "Làm việc với tệp và thư mục"],
    learning_outcomes: ["Luyện thao tác hệ thống tệp và tìm kiếm", "Đọc, lọc và xử lý nội dung bằng lệnh"],
    practice_strategy: "Luyện song song với Linux for Noobs theo kỹ năng vừa học; không cần làm hết trước khi học Shell.",
  },
  "shell-for-beginners": {
    prerequisite_skills: ["Lệnh Linux cơ bản", "Chuyển hướng và đường ống"],
    learning_outcomes: ["Viết và chạy shell script", "Ghép các lệnh thành quy trình có thể lặp lại"],
    practice_strategy: "Tự viết script nhỏ, chạy lại trên dữ liệu mới và kiểm tra mã thoát trước khi học tự động hóa quản trị.",
  },
  "become-a-junior-system-administrator": {
    prerequisite_skills: ["Quyền và tài khoản", "Xử lý văn bản", "Shell script cơ bản"],
    learning_outcomes: ["Thực hành tài khoản, quyền, tiến trình, gói phần mềm và mạng", "Lập lịch sao lưu và viết script vận hành"],
    practice_strategy: "Làm theo thứ tự 10 ngày; nếu vướng lệnh nền tảng, quay lại kỹ năng tương ứng ở Linux for Noobs. Bước kernel log cần VM riêng.",
  },
  "comptia-linux-plus-training-labs": {
    prerequisite_skills: ["Quản trị Linux cơ bản", "Shell và tự động hóa"],
    learning_outcomes: ["Củng cố các nhóm kỹ năng quản trị Linux", "Luyện xử lý tình huống theo mục tiêu Linux+"],
    practice_strategy: "Dùng sau Junior để tìm phần kiến thức còn thiếu; hoàn thành local không đồng nghĩa đạt chứng chỉ.",
  },
  "linux-security-for-devsecops": {
    prerequisite_skills: ["Tài khoản và phân quyền", "Dịch vụ và mạng Linux"],
    learning_outcomes: ["Thực hành cấu hình bảo mật Linux", "Đánh giá quyền truy cập và cấu hình hệ thống"],
    practice_strategy: "Học sau nền tảng quản trị; thực hành cấu hình trong môi trường cách ly theo khả năng hỗ trợ của từng bài.",
  },
  "linux-practice-challenges": {
    prerequisite_skills: ["Kỹ năng tương ứng với challenge được chọn"],
    learning_outcomes: ["Giải bài Linux với ít hướng dẫn hơn", "Ôn tập và nhận biết kỹ năng cần học lại"],
    practice_strategy: "Chọn challenge để ôn xen kẽ từ giai đoạn nền tảng, không phải chờ hoàn tất bảy khóa khác.",
  },
};

// The official syllabus reuses six lesson IDs in more than one course. Keep
// one canonical lesson, environment and set of task IDs instead of duplicating
// files or pretending that these already implemented lessons are unavailable.
export function listCourseLabs(courseId, labs = listLabs(), index = readLinuxIndex()) {
  const course = index.courses.find(item => item.id === courseId);
  if (!course) return labs.filter(lab => lab.course_id === courseId);
  return course.stages.flatMap(stage => stage.labs).map(reference =>
    labs.find(lab => lab.course_id === courseId && Number(lab.source_lab_id) === reference.source_lab_id) ||
    labs.find(lab => Number(lab.source_lab_id) === reference.source_lab_id)).filter(Boolean);
}

export function courseReadiness(courseId, labs = listLabs(), index = readLinuxIndex()) {
  const imported = listCourseLabs(courseId, labs, index);
  const availability = imported.map(lab => getLabReadiness(lab));
  const ready = availability.filter(lab => lab.can_grade).length;
  const practice = availability.filter(lab => lab.can_start_terminal).length;
  return { imported_labs_count: imported.length, runnable_labs_count: ready, practice_labs_count: practice,
    supported_tasks_count: availability.reduce((sum, lab) => sum + lab.supported_steps_count, 0) };
}

export function getLinuxRoadmap() {
  const index = readLinuxIndex();
  const outlines = readLinuxOutlines();
  const labs = listLabs();
  const courses = ORDER.map((id, order) => {
    const source = index.courses.find(course => course.id === id);
    const readiness = courseReadiness(id, labs, index);
    const status = readiness.imported_labs_count && readiness.runnable_labs_count === readiness.imported_labs_count ? "ready" : readiness.imported_labs_count ? "partial" : "reference-only";
    const sections = source.stages.flatMap(stage => stage.labs).flatMap(lab => outlines.lessons.find(item => item.source_lab_id === lab.source_lab_id)?.sections || []);
    return { id, alias: id, name: NAMES[id], order: order + 1, prerequisites: PREREQUISITES[order], ...GUIDANCE[id], ...readiness,
      source_sections_count: sections.length, source_tasks_count: sections.filter(section => section.need_verify).length,
      source_url: source.source_url, source_labs_count: source.source_labs_count, status,
      reason: status === "ready" ? "Đã có nội dung và bộ kiểm tra local cho toàn khóa."
        : status === "partial" ? "Đã có nội dung local; xem trạng thái từng bài và nhiệm vụ trước khi thực hành."
          : "Đã đối chiếu giáo trình nguồn; nội dung thực hành local chưa được triển khai." };
  });
  return { id: "linux-system-administrator", title: "Lộ trình Linux cho System Administrator",
    source: { url: index.source_url, observed_at: index.observed_at }, order_kind: "recommended-local", source_order: index.source_order,
    prerequisites_advisory: true,
    courses, stages: [
      { id: "foundations", name: "Nền tảng Linux", description: "Học terminal, tệp, quyền và tài khoản; luyện lệnh song song.", course_ids: ORDER.slice(0, 3) },
      { id: "operations", name: "Shell và vận hành hệ thống", description: "Viết script rồi áp dụng vào các tình huống quản trị.", course_ids: ORDER.slice(3, 5) },
      { id: "administration", name: "Quản trị và bảo mật", description: "Củng cố quản trị hệ thống và kiểm tra cấu hình bảo mật.", course_ids: ORDER.slice(5, 7) },
      { id: "practice", name: "Luyện tập xuyên suốt", description: "Chọn thử thách theo kỹ năng đã học; không cần chờ hoàn tất mọi khóa.", course_ids: [ORDER[7]] },
    ], totals: { source_courses: courses.length, source_labs: courses.reduce((n, c) => n + c.source_labs_count, 0),
      imported_labs: courses.reduce((n, c) => n + c.imported_labs_count, 0),
      unique_imported_labs: new Set(courses.flatMap(course => listCourseLabs(course.id, labs, index).map(lab => lab.id))).size,
      runnable_labs: courses.reduce((n, c) => n + c.runnable_labs_count, 0) } };
}
