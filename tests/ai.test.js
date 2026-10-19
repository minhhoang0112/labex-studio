import test from "node:test";
import assert from "node:assert/strict";
import { getTutorReply, getTutorConfiguration } from "../server/routes/ai.js";

test("offline tutor uses the current task and makes no network request", async () => {
  const result = await getTutorReply({ message: "gợi ý", context: { task: "Tạo greetings.txt", hint: "Dùng echo > greetings.txt" } }, {
    env: {}, fetchImpl: () => assert.fail("Offline mode must not call an API"),
  });
  assert.equal(result.mode, "offline");
  assert.match(result.reply, /echo > greetings.txt/);
});

test("OpenAI configured provider receives history and reads actual output items", async () => {
  const result = await getTutorReply({ message: "Tại sao?", history: [{ role: "user", content: "chmod 700" }] }, {
    env: { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "configured-model" },
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      const body = JSON.parse(options.body);
      assert.equal(body.model, "configured-model");
      assert.equal(body.store, false);
      assert.equal(body.input[0].content, "chmod 700");
      return { ok: true, json: async () => ({ output: [{ type: "reasoning" }, { type: "message", content: [{ type: "output_text", text: "Chỉ chủ sở hữu có quyền." }] }] }) };
    },
  });
  assert.equal(result.mode, "openai");
  assert.match(result.reply, /chủ sở hữu/);
});

test("Gemini HTTP failure falls back with a visible notice", async () => {
  const result = await getTutorReply({ message: "grep" }, {
    env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "configured-model" },
    fetchImpl: async () => ({ ok: false, status: 401 }),
  });
  assert.equal(result.mode, "offline");
  assert.ok(result.notice);
  assert.match(result.reply, /grep/);
  assert.deepEqual(result.issues, [{ provider: 'gemini', code: 'http_401' }]);
});

test('Gemini successful replies name the actual model and never include thought parts', async () => {
  const result = await getTutorReply({ message: 'ADUC là gì?', context: { labId: 'win-server-ad-users-groups', platform: 'windows' } }, {
    env: { GEMINI_API_KEY: 'secret-for-test', GEMINI_MODEL: 'configured-model' },
    fetchImpl: async (_url, options) => {
      const input = JSON.parse(options.body);
      assert.match(input.systemInstruction.parts[0].text, /Windows Server/);
      assert.match(input.systemInstruction.parts[0].text, /Azure VM/);
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ thought: true, text: 'private-thought' }, { text: 'Mở công cụ ADUC trên VM.' }] } }] }) };
    },
  });
  assert.equal(result.mode, 'gemini');
  assert.equal(result.model, 'configured-model');
  assert.equal(result.reply, 'Mở công cụ ADUC trên VM.');
});

test('placeholder keys make no provider requests and configuration never returns secrets', async () => {
  const env = { GEMINI_API_KEY: 'your_gemini_api_key_here', GEMINI_MODEL: 'model-name' };
  const config = getTutorConfiguration(env);
  assert.equal(config.configured, false);
  const result = await getTutorReply({ message: 'chào' }, { env, fetchImpl: () => assert.fail('Placeholder key must not be submitted') });
  assert.equal(result.mode, 'offline');
  assert.equal(JSON.stringify(getTutorConfiguration({ GEMINI_API_KEY: 'secret-key-value' })).includes('secret-key-value'), false);
});

test('offline Windows hints do not send the learner to Linux commands', async () => {
  const result = await getTutorReply({ message: 'Get-ADUser is not recognized', context: { platform: 'windows' } }, { env: {} });
  assert.equal(result.mode, 'offline');
  assert.match(result.reply, /ActiveDirectory/);
  assert.doesNotMatch(result.reply, /command -v|chmod/);
});
