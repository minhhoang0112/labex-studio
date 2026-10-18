import fs from "node:fs";

const filePath = "client/src/views/LabWorkspace.jsx";
let content = fs.readFileSync(filePath, "utf8");

// 1. Add imports
if (!content.includes("WindowsConsole")) {
  content = content.replace(
    "import { \n  ArrowLeft,",
    "import WindowsConsole from '../components/WindowsConsole';\nimport { \n  Server,\n  ArrowLeft,"
  );
  if (!content.includes("WindowsConsole")) {
    content = content.replace(
      "import {",
      "import WindowsConsole from '../components/WindowsConsole';\nimport { Server,"
    );
  }
}

// 2. Set active tab on load
if (!content.includes("setActiveEnvTab('windows')")) {
  content = content.replace(
    "setLab(data);",
    "setLab(data);\n        if (data.id?.startsWith('win-') || data.course_id?.includes('win')) {\n          setActiveEnvTab('windows');\n        }"
  );
}

// 3. Define isWindowsLab
if (!content.includes("const isWindowsLab =")) {
  content = content.replace(
    "const isDocFullscreen = currentSection?.layout === 'doc-fullscreen';",
    "const isDocFullscreen = currentSection?.layout === 'doc-fullscreen';\n  const isWindowsLab = Boolean(lab?.id?.startsWith('win-') || lab?.course_id?.includes('win'));"
  );
}

// 4. Add Windows tab button
const windowsTabButton = `          {/* Windows Console Tab */}
          {isWindowsLab && (
            <button
              onClick={() => setActiveEnvTab('windows')}
              className={\`px-3 py-1 rounded-md flex items-center gap-1.5 transition \${
                activeEnvTab === 'windows'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }\`}>
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Windows Console</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            </button>
          )}

`;

if (!content.includes("Windows Console Tab")) {
  content = content.replace(
    "{/* Desktop Tab */}",
    windowsTabButton + "          {/* Desktop Tab */}"
  );
}

// 5. Add Windows Console Component render
const windowsConsoleRender = `          {/* Windows Server Console Simulator */}
          {activeEnvTab === 'windows' && isWindowsLab && (
            <div className="flex-1 min-h-0 min-w-0 relative flex flex-col">
              <WindowsConsole 
                labId={lab.id} 
                onActionComplete={() => setVerificationEpoch(v => v + 1)} 
              />
            </div>
          )}

`;

if (!content.includes("Windows Server Console Simulator")) {
  content = content.replace(
    "{/* Terminal Session - ALWAYS kept mounted so PTY shell does not disconnect */}",
    windowsConsoleRender + "          {/* Terminal Session - ALWAYS kept mounted so PTY shell does not disconnect */}"
  );
}

fs.writeFileSync(filePath, content, "utf8");
console.log("Successfully patched LabWorkspace.jsx with Windows Console integration!");

