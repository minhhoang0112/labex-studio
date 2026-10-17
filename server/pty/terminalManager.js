// Verified candidate; intended location: server/pty/terminalManager.js.
import pty from "node-pty";
import { getLabProcess, getEnvironment } from "./linuxEnvironment.js";

function dimension(value, fallback, max) {
  return Number.isInteger(value) && value >= 2 && value <= max ? value : fallback;
}

const READY_MARKER = "__LABEX_LOCAL_SHELL_READY_173A__";

export async function createTerminalSession(ws, options = {}) {
  let terminal = null;
  let disposed = false;
  let dataSubscription;
  let exitSubscription;
  let bootTimer;
  let shellReady = false;
  let bootOutput = "";
  const send = (payload) => {
    if (ws.readyState !== 1) return;
    try { ws.send(JSON.stringify(payload)); } catch { /* Socket closed concurrently. */ }
  };
  const cleanup = (exited = false) => {
    if (disposed) return;
    disposed = true;
    clearTimeout(bootTimer);
    dataSubscription?.dispose();
    exitSubscription?.dispose();
    ws.off("message", onMessage);
    ws.off("close", cleanup);
    ws.off("error", cleanup);
    if (terminal && exited !== true) {
      try { terminal.kill(); } catch { /* Already exited. */ }
    }
    if (process.platform === "win32" && terminal) {
      // node-pty 1.1.0 leaves its ConPTY DLL worker alive if no further data
      // arrives after kill. Dispose its pipes explicitly until upstream fixes
      // that lifecycle. Optional access keeps this compatible with new versions.
      try { terminal._agent?._conoutSocketWorker?.dispose(); } catch { /* Already disposed. */ }
      try { terminal._agent?.inSocket?.destroy(); } catch { /* Already closed. */ }
      try { terminal._agent?.outSocket?.destroy(); } catch { /* Already closed. */ }
    }
  };
  function onMessage(message) {
    if (!terminal || disposed) return;
    try {
      if (message.length > 65536) return;
      const packet = JSON.parse(message.toString());
      if (!packet || typeof packet !== "object") return;
      if (packet.type === "input" && typeof packet.data === "string" && packet.data.length <= 65536) {
        // ConPTY handles these terminal reports itself. Forwarding xterm's DA
        // or focus response to Bash can leave "1;2c" at the command prompt.
        // Match whole reports only; cursor keys and ordinary input still pass.
        if (/^\x1b\[(?:[?>]?[0-9;]*c|[IO])$/.test(packet.data)) return;
        try { terminal.write(packet.data); } catch { /* Ignore write after close */ }
      } else if (packet.type === "resize" && Number.isInteger(packet.cols) && Number.isInteger(packet.rows)
        && packet.cols >= 2 && packet.cols <= 500 && packet.rows >= 2 && packet.rows <= 200) {
        try { terminal.resize(packet.cols, packet.rows); } catch { /* Ignore resize after close */ }
      }
    } catch { /* Malformed protocol packets are never terminal input. */ }
  }
  ws.on("close", cleanup);
  ws.on("error", cleanup);
  try {
    const spec = await getLabProcess(options.labId);
    const environment = await getEnvironment();
    if (disposed || ws.readyState !== 1) { cleanup(); return null; }
    terminal = pty.spawn(spec.file, spec.args, {
      name: "xterm-256color",
      cols: dimension(options.cols, 80, 500),
      rows: dimension(options.rows, 24, 200),
      env: { ...process.env, TERM: "xterm-256color" },
      ...(process.platform === "win32" ? { useConpty: true, useConptyDll: true } : {}),
    });
    if (process.platform === "win32" && terminal._agent) {
      terminal._agent.inSocket?.on("error", () => {});
      terminal._agent.outSocket?.on("error", () => {});
    }
    terminal.on("error", () => {
      if (disposed) return;
      send({ type: "error", message: "Kết nối terminal Linux bị gián đoạn. Hãy kết nối lại." });
      cleanup();
      if (ws.readyState === 1) ws.close(1011, "Terminal connection failed");
    });
    bootTimer = setTimeout(() => {
      if (disposed || shellReady) return;
      if (bootOutput) send({ type: "output", data: bootOutput });
      send({ type: "error", message: "Môi trường Linux chưa khởi động xong sau 20 giây. Hãy kết nối lại." });
      cleanup();
      if (ws.readyState === 1) ws.close(1011, "Linux shell startup timeout");
    }, 20000);
    bootTimer.unref();
    dataSubscription = terminal.onData((data) => {
      if (shellReady) { send({ type: "output", data }); return; }
      bootOutput += data;
      const marker = bootOutput.indexOf(READY_MARKER);
      if (marker >= 0) {
        shellReady = true;
        clearTimeout(bootTimer);
        const output = bootOutput.slice(0, marker) + bootOutput.slice(marker + READY_MARKER.length);
        bootOutput = "";
        send({ type: "ready", labId: options.labId, shell: "/bin/bash", environment });
        if (output) send({ type: "output", data: output });
      } else if (bootOutput.length > READY_MARKER.length) {
        const cut = bootOutput.length - READY_MARKER.length;
        send({ type: "output", data: bootOutput.slice(0, cut) });
        bootOutput = bootOutput.slice(cut);
      }
    });
    exitSubscription = terminal.onExit(({ exitCode, signal }) => {
      if (!shellReady && !disposed) {
        if (bootOutput) send({ type: "output", data: bootOutput });
        send({ type: "error", message: "Môi trường Linux đã thoát trước khi Bash sẵn sàng. Kiểm tra cấu hình và kết nối lại." });
      }
      send({ type: "exit", exitCode, signal });
      cleanup(true);
      if (ws.readyState === 1) ws.close(shellReady ? 1000 : 1011, "Terminal exited");
    });
    ws.on("message", onMessage);
    return terminal;
  } catch (error) {
    send({ type: "error", message: error.code === "ENVIRONMENT_UNAVAILABLE"
      ? error.message : "Không thể mở terminal Linux. Kiểm tra cấu hình WSL và thử lại." });
    cleanup();
    if (ws.readyState === 1) ws.close(1011, "Linux terminal unavailable");
    return null;
  }
}
