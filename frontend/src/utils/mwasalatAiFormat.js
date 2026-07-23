// Small hand-rolled formatter for the AI assistant's answers — bold text,
// bullet/numbered lines, and paragraph breaks. Not a general markdown parser:
// Gemini's answers here are short data summaries, not long documents, so this
// covers the shapes that actually show up instead of pulling in a full
// markdown-rendering dependency.

const parseInline = (line) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    return match ? { key: i, text: match[1], bold: true } : { key: i, text: part, bold: false };
  });
};

export function formatAiAnswer(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) blocks.push(currentList);
    currentList = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    const numberedMatch = line.match(/^\d+[.)]\s+(.*)/);

    if (bulletMatch || numberedMatch) {
      const ordered = Boolean(numberedMatch);
      const content = (bulletMatch || numberedMatch)[1];
      if (!currentList || currentList.ordered !== ordered) {
        flushList();
        currentList = { type: 'list', ordered, items: [] };
      }
      currentList.items.push(parseInline(content));
    } else {
      flushList();
      blocks.push({ type: 'paragraph', parts: parseInline(line) });
    }
  });
  flushList();

  return blocks;
}
