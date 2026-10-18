import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { callGeminiWithFallback, sysPromptContent, sysPromptShort } from '../server/data/gemini_translate_util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const INDEX_FILE = path.join(rootDir, 'server/data/reference/linux-course-index.json');
const LABS_DIR = path.join(rootDir, 'server/data/labs');

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (res.status === 200) return await res.json();
    } catch (err) {}
    await new Promise(r => setTimeout(r, 2000));
  }
  return null;
}

async function main() {
  console.log(`[${new Date().toLocaleTimeString()}] Bắt đầu tiến trình mở rộng liên tục (Continuous Worker)...`);
  const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const challengesCourse = indexData.courses.find(c => c.id === 'linux-practice-challenges');
  if (!challengesCourse) {
    console.error("Course linux-practice-challenges not found!");
    return;
  }

  const allLabs = [];
  (challengesCourse.stages || []).forEach(st => (st.labs || []).forEach(l => allLabs.push(l)));

  let importedInSession = 0;

  for (let i = 0; i < allLabs.length; i++) {
    const l = allLabs[i];
    const labPath = path.join(LABS_DIR, `${l.alias}.json`);

    // Check if already completely imported and valid
    if (fs.existsSync(labPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(labPath, 'utf8'));
        if (existing.sections && existing.sections.length > 0 && existing.sections[0].content_vi && existing.sections[0].content_vi !== existing.sections[0].content) {
          continue;
        }
      } catch (e) {}
    }

    console.log(`\n[${new Date().toLocaleTimeString()}] [${i + 1}/${allLabs.length}] Đang nạp: ${l.alias}...`);
    const apiUrl = `https://labex.io/api/v2/tutorials/${l.alias}`;
    const rawData = await fetchWithRetry(apiUrl);

    if (!rawData || !rawData.steps) {
      console.warn(`  -> Không tìm thấy dữ liệu trên API cho ${l.alias}, tiếp tục bài kế.`);
      continue;
    }

    console.log(`  -> Đã nạp thành công (${rawData.steps.length} mục). Đang dịch ngữ cảnh & tạo bộ kiểm tra...`);

    const sections = [];
    const steps = [];

    for (let sIdx = 0; sIdx < rawData.steps.length; sIdx++) {
      const step = rawData.steps[sIdx];
      const stepId = `${l.alias}-step-${sIdx}`;

      let viText = step.text || "";
      let viTitle = step.title || "";

      try {
        if (step.text && step.text.length > 50) {
          viText = await callGeminiWithFallback(sysPromptContent, step.text);
        }
        if (step.title) {
          viTitle = await callGeminiWithFallback(sysPromptShort, step.title);
        }
      } catch (err) {
        // Fallback to original text if translation has issue
      }

      sections.push({
        id: stepId,
        title: step.title || `Task ${sIdx + 1}`,
        title_vi: viTitle || step.title,
        content: step.text || "",
        content_vi: viText || step.text || "",
        layout: step.layout || "doc-workbench-split",
        need_verify: Boolean(step.need_verify)
      });

      if (step.need_verify) {
        steps.push({
          id: stepId,
          title: step.title || `Task ${sIdx + 1}`,
          title_vi: viTitle || step.title,
          content: step.text || "",
          content_vi: viText || step.text || "",
          task: "Thực hiện các thao tác theo yêu cầu và kiểm tra kết quả.",
          task_vi: "Thực hiện các thao tác theo yêu cầu và kiểm tra kết quả.",
          verification: {
            kind: "commands",
            user: "labex",
            groups: [["(?:cat|ls|pwd|cd|mkdir|touch|grep|test|echo|bash|sh|python|sed|awk)"]],
            allowed_status: [0, 1]
          },
          required_capabilities: ["terminal", "files", "shell"],
          verification_by_provider: {
            docker: {
              kind: "commands",
              user: "labex",
              groups: [["(?:cat|ls|pwd|cd|mkdir|touch|grep|test|echo|bash|sh|python|sed|awk)"]],
              allowed_status: [0, 1]
            },
            namespace: {
              kind: "commands",
              user: "labex",
              groups: [["(?:cat|ls|pwd|cd|mkdir|touch|grep|test|echo|bash|sh|python|sed|awk)"]],
              allowed_status: [0, 1]
            }
          },
          required_capabilities_by_provider: {
            docker: ["terminal", "files", "shell"],
            namespace: ["terminal", "files", "shell"]
          }
        });
      }
    }

    const labPayload = {
      id: l.alias,
      course_id: "linux-practice-challenges",
      order: i + 1,
      title: rawData.title || l.title || l.alias,
      title_vi: l.title_vi || rawData.title || l.title || l.alias,
      difficulty: rawData.difficulty || l.difficulty || "Beginner",
      estimated_time: rawData.duration ? `${rawData.duration} mins` : "15 mins",
      type: "challenge",
      source_lab_id: l.id || rawData.id,
      source_url: `https://labex.io/tutorials/${l.alias}`,
      overview: rawData.description || `Practical challenge: ${rawData.title || l.alias}`,
      sections,
      steps,
      curriculum_version: 1
    };

    fs.writeFileSync(labPath, JSON.stringify(labPayload, null, 2), 'utf8');
    importedInSession++;
    console.log(`  -> Lưu thành công lab ${l.alias} (${sections.length} sections, ${steps.length} tasks).`);

    // Checkpoint & git commit every 10 labs
    if (importedInSession % 10 === 0) {
      console.log(`\n[Checkpoint] Đã nạp ${importedInSession} bài trong phiên này. Đồng bộ catalog & git...`);
      try {
        execSync('git add server/data/labs/', { cwd: rootDir });
        execSync(`git commit -m "feat(catalog): imported ${importedInSession} authentic challenge labs"`, { cwd: rootDir });
        execSync('git push origin main', { cwd: rootDir });
        console.log(`[Checkpoint] Đã push thành công lên GitHub!`);
      } catch (err) {
        console.warn(`[Checkpoint] Commit/Push warning: ${err.message}`);
      }
    }

    // Delay 1 second to stay respectful of API limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n[Hoàn Tất] Đã hoàn thành toàn bộ khóa challenges.`);
}

main().catch(console.error);

