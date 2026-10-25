// Inspect prose only: English commands, output, identifiers and URLs are valid in VI.
export function proseLines(markdown = '') {
  return String(markdown)
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .split('\n').map(line => line.trim()).filter(Boolean);
}

export function untranslatedProse(english, vietnamese) {
  const source = new Set(proseLines(english));
  return proseLines(vietnamese).filter(line => {
    if (/[à-ỹđĐ]/u.test(line) || !source.has(line)) return false;
    const words = line.match(/[a-z]+/gi) || [];
    return words.length >= 5 || /^#{1,6}\s+(?:Introduction|Summary)\s*$/.test(line);
  });
}

export function needsVietnameseTranslation(english, vietnamese) {
  return !String(vietnamese || '').trim() || untranslatedProse(english, vietnamese).length > 0;
}
