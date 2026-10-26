// Legacy Windows lessons keep their runnable collector in hint. Present that
// collector as optional code, rather than flattening it into the hint paragraph.
export function taskHintPresentation(hint, content = '', isVi = true) {
  const text = String(hint || '');
  const isScript = text.length > 300 &&
    /(?:\$[\w:]+\s*=|\bfunction\s+[\w-]+\s*\{|\b(?:Get|Set|New|ConvertTo|Write|Test|Join)-[A-Za-z]+\b)/.test(text);
  if (!isScript) return { text, script: '' };
  // The lesson already explains the purpose immediately before its full code.
  const prose = String(content).replace(/```[\s\S]*?```/g, '');
  const rationale = prose.match(/^#{2,4}\s+(?:Vì sao làm bước này\??|Why this step\??)\s*\r?\n+([^\n#][\s\S]*?)(?=\r?\n\s*\r?\n|\r?\n#{1,6}\s|$)/mi)?.[1]?.trim();
  const summary = rationale && rationale.length <= 600 ? rationale : (isVi
    ? 'Đọc yêu cầu và đối chiếu kết quả mong đợi trong hướng dẫn. Khi cần, mở khối lệnh bên dưới và sao chép nguyên khối vào PowerShell của bài.'
    : 'Review the requirements and expected results in the guide. If needed, expand the code below and copy the entire block into this lab’s PowerShell.');
  return { text: summary, script: text };
}
