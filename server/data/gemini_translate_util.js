import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No GEMINI_API_KEY found in .env");
  process.exit(1);
}

// Active models with available quota
const MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'];

async function callGeminiWithFallback(systemPrompt, userText, retryCount = 5) {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    for (const model of MODELS) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nNội dung cần dịch:\n${userText}` }]
          }
        ],
        generationConfig: {
          temperature: 0.1
        }
      };

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.status === 200) {
          const data = await res.json();
          const out = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (out) {
            // Success: small pace delay (800ms) to stay within free-tier RPM
            await new Promise(r => setTimeout(r, 800));
            return out;
          }
        } else if (res.status === 429 || res.status === 503) {
          // Model rate-limited or high load, continue to next model
          continue;
        }
      } catch (err) {
        continue;
      }
    }
    // If all models hit limits, wait 5 seconds before next retry cycle
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error("Tất cả models tạm thời chạm giới hạn hoặc bận. Sẽ thử lại vòng tiếp theo.");
}

const sysPromptContent = `Bạn là chuyên gia dịch thuật tài liệu kỹ thuật Linux và trợ lý AI giáo dục LabEx.
Nhiệm vụ: Dịch nội dung bài học Linux từ tiếng Anh sang tiếng Việt tự nhiên, chuẩn xác, đầy đủ 100% không tóm tắt.
QUY TẮC BẮT BUỘC:
1. Giữ nguyên 100% tất cả các khối lệnh, cú pháp markdown (#, ##, ###, -, *, 1., 2., blockquote >), code block (\`\`\`bash ... \`\`\`), inline code (\`whoami\`, \`uname\`, tên tệp, đường dẫn như \`/home/labex/project\`, \`~/project\`).
2. KHÔNG thay đổi hoặc dịch tên lệnh, tham số, cờ (flag), biến môi trường, đường dẫn tệp.
3. KHÔNG tự ý thêm bớt nội dung, không tóm tắt. Dịch sát nghĩa, đầy đủ từng câu, từng đoạn từ văn bản gốc.
4. Trả về đúng nội dung đã dịch ở định dạng Markdown, không bọc trong lời dẫn hay giải thích thêm.`;

const sysPromptShort = `Dịch tiêu đề hoặc câu ngắn này từ tiếng Anh sang tiếng Việt ngắn gọn, chuẩn xác theo thuật ngữ Linux / Quản trị hệ thống. Giữ nguyên các từ lệnh hoặc tên tệp nếu có. Chỉ trả về kết quả dịch, không thêm giải thích hay dấu ngoặc kép.`;

export { callGeminiWithFallback, sysPromptContent, sysPromptShort };
