import test from "node:test";
import assert from "node:assert/strict";
import { getTutorReply } from "../server/routes/ai.js";

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
});
