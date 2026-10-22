import "dotenv/config";
import express from "express";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { spawn } from "node:child_process";
import coursesRouter from "./routes/courses.js";
import verifyRouter from "./routes/verify.js";
import aiRouter from "./routes/ai.js";
import { createCloudVmRouter } from "./routes/cloudVm.js";
import { createDesktopGateway } from "./services/desktopGateway.js";
import { createLiveVoiceGateway } from "./services/liveVoiceGateway.js";
import { createEnvironmentRouter } from "./routes/environment.js";
import { createTerminalSession } from "./pty/terminalManager.js";
import { getEnvironment } from "./pty/linuxEnvironment.js";
import { isValidId, loadLab } from "./data/catalog.js";
import { getLabReadiness } from "./services/readiness.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || "127.0.0.1";
const desktopGateway = createDesktopGateway();
const liveVoiceGateway = createLiveVoiceGateway();

process.on("uncaughtException", (error) => {
  if (error?.code === "EPIPE" || error?.code === "ECONNRESET") {
    console.warn("Ignored socket disconnect:", error.code);
    return;
  }
  console.error("Uncaught exception:", error);
});

function allowedOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      [String(port), "5173"].includes(url.port);
  } catch { return false; }
}
app.use((req, res, next) => {
  if (!allowedOrigin(req.headers.origin)) return res.status(403).json({ error: "Chỉ hỗ trợ truy cập local." });
  next();
});
app.use(express.json({ limit: "128kb" }));
app.get("/api/health", async (_req, res, next) => {
  try { res.json({ status: "ok", environment: await getEnvironment() }); }
  catch (error) { next(error); }
});
app.post("/api/system/shutdown", (_req, res) => {
  res.json({ ok: true, message: "Hệ thống đang tắt và giải phóng tài nguyên..." });
  setTimeout(() => {
    process.exit(0);
  }, 400);
});
app.use("/api", coursesRouter);
app.use("/api", createEnvironmentRouter({ disconnect: async (labId) => {
  const clients = [...wss.clients].filter(client => client.labId === labId);
  await Promise.all(clients.map(client => new Promise(resolve => {
    if (client.readyState === 3) return resolve();
    const timer = setTimeout(() => { client.terminate(); resolve(); }, 1000);
    client.once("close", () => { clearTimeout(timer); resolve(); });
    client.close(1012, "Lab environment reset");
  })));
} }));
app.use("/api", verifyRouter);
app.use("/api", createCloudVmRouter({ desktop: desktopGateway }));
app.use("/api/ai", aiRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "API không tồn tại." }));

const distPath = path.join(__dirname, "../client/dist");
app.use(express.static(distPath));
app.get(/.*/, (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (!req.accepts("html") || path.extname(req.path)) return res.status(404).send("Not found");
  if (fs.existsSync(indexPath)) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.sendFile(indexPath);
  }
  res.status(503).type("text").send("Frontend chưa được build. Chạy npm run build:client hoặc mở run.bat.");
});
app.use((error, _req, res, _next) => {
  console.error(error.message);
  const status = error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({ error: status === 500 ? "Máy chủ gặp lỗi. Hãy kiểm tra console." : "Dữ liệu yêu cầu không hợp lệ." });
});
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === '/ws/ai/live' && allowedOrigin(req.headers.origin)) {
    liveVoiceGateway.upgrade(req,socket,head);
    return;
  }
  if (url.pathname === '/ws/desktop' && allowedOrigin(req.headers.origin)) {
    desktopGateway.upgrade(req, socket, head);
    return;
  }
  if (url.pathname !== "/ws/terminal" || !allowedOrigin(req.headers.origin)) {
    socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    return;
  }
  const labId = url.searchParams.get("labId");
  const lab = isValidId(labId) ? loadLab(labId) : null;
  if (!lab) {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
    return;
  }
  if (!getLabReadiness(lab).can_start_terminal) {
    socket.end("HTTP/1.1 409 Conflict\r\nConnection: close\r\n\r\n");
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.labId = labId;
    createTerminalSession(ws, { labId }).catch((error) => {
      console.error("Terminal:", error.message);
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "error", message: "Không thể khởi tạo terminal Linux." }));
        ws.close(1011, "Terminal unavailable");
      }
    });
  });
});
server.on("error", (error) => {
  console.error(error.code === "EADDRINUSE" ? "Cổng đã được sử dụng. Hãy đóng phiên LabEx cũ hoặc đổi PORT trong .env." : error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  const url = "http://127.0.0.1:" + port + "/learn";
  console.log("LabEx Local: " + url);
  if (process.platform === "win32" && process.env.LABEX_OPEN_BROWSER === "1") {
    const browser = spawn("rundll32.exe", ["url.dll,FileProtocolHandler", url], { windowsHide: true, stdio: "ignore" });
    browser.on("error", () => console.log("Mở trình duyệt tại " + url));
  }
});
function shutdown() {
  liveVoiceGateway.close();
  for (const client of wss.clients) client.close(1001, "Server shutting down");
  wss.close();
  server.close();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
