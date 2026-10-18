import fs from 'node:fs';
import path from 'node:path';

const INDEX_FILE = 'server/data/reference/linux-course-index.json';
const OUTPUT_DIR = 'server/data/reference/commands-course';

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (res.status === 200) {
        return await res.json();
      }
      console.warn(`Fetch ${url} returned ${res.status}, attempt ${i + 1}`);
    } catch (err) {
      console.warn(`Fetch error on ${url}: ${err.message}, attempt ${i + 1}`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return null;
}

async function fetchAll41Labs() {
  const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const course = indexData.courses.find(c => c.id === 'linux-basic-commands-practice-online' || c.id === 'linux-commands-practice-online');
  if (!course) throw new Error("Course not found in index");

  const labs = [];
  course.stages.forEach(st => st.labs.forEach(l => labs.push(l)));
  console.log(`Bắt đầu tải trọn vẹn 100% nội dung gốc cho ${labs.length} bài lab của Linux Commands Practice Online...`);

  let successCount = 0;
  for (let i = 0; i < labs.length; i++) {
    const l = labs[i];
    const targetFile = path.join(OUTPUT_DIR, `${l.alias}.json`);

    if (fs.existsSync(targetFile)) {
      console.log(`[${i + 1}/${labs.length}] ${l.alias} đã có sẵn, bỏ qua.`);
      successCount++;
      continue;
    }

    const apiUrl = `https://labex.io/api/v2/tutorials/${l.alias}`;
    console.log(`[${i + 1}/${labs.length}] Đang tải: ${l.alias}...`);
    const data = await fetchWithRetry(apiUrl);

    if (data && data.steps) {
      fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');
      console.log(`  -> Lưu thành công (${data.steps.length} steps, tổng ${data.steps.reduce((acc, s) => acc + (s.text?.length || 0), 0)} ký tự).`);
      successCount++;
    } else {
      console.error(`  -> THẤT BẠI khi tải ${l.alias}`);
    }

    // Delay 500ms giữa các request để giữ an toàn rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n======================================================`);
  console.log(`HOÀN TẤT TẢI: ${successCount}/${labs.length} bài đã lưu vào ${OUTPUT_DIR}`);
  console.log(`======================================================`);
}

fetchAll41Labs().catch(console.error);

