// Print model/status metadata only. Never print API keys or raw provider errors.
import 'dotenv/config';
import fs from 'node:fs/promises';
const key = process.env.GEMINI_API_KEY;
const configured = process.env.GEMINI_MODEL || '';
const report = { checkedAt: new Date().toISOString(), configuredModel: configured };
if (!key || key.startsWith('your_')) {
  report.result = 'missing-key';
} else {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', {
      headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    report.modelsHttpStatus = response.status;
    report.providerStatus = data.error?.status;
    report.reason = data.error?.details?.find(item => item.reason)?.reason;
    if (response.ok) {
      report.models = (data.models || []).filter(model => model.supportedGenerationMethods?.includes('generateContent'))
        .map(model => model.name.replace(/^models\//, ''));
      report.configuredModelListed = report.models.includes(configured);
      if (process.argv.includes('--generate')) {
        const model = process.argv.find(arg => arg.startsWith('--model='))?.slice(8) || configured;
        const generated = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          signal: AbortSignal.timeout(30000),
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Chào Labby. Trả lời một câu ngắn bằng tiếng Việt.' }] }] }),
        });
        const answer = await generated.json();
        report.generation = { model, httpStatus: generated.status, providerStatus: answer.error?.status,
          reason: answer.error?.details?.find(item => item.reason)?.reason,
          hasReply: Boolean(answer.candidates?.[0]?.content?.parts?.some(part => part.text && !part.thought)) };
      }
    }
  } catch (error) { report.result = error.name === 'TimeoutError' ? 'timeout' : 'network-error'; }
}
await fs.writeFile('.artifacts/ai-provider-check.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
