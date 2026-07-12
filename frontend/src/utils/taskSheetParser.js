// ─── Item ↔ raw text conversions ─────────────────────────────────────────────

/** Convert an items[] array back to editable textarea text */
export function itemsToText(items) {
  if (!items?.length) return '';
  return items
    .map(item => (item.indent === 1 ? `    ${item.text}` : item.text))
    .join('\n');
}

/** Convert pasted/typed textarea text into structured items[].
 *  Handles: •  -  –  o<space>  o<Letter>  4-space indent  numbered lists */
export function textToItems(text) {
  return text
    .split('\n')
    .map(rawLine => {
      const t = rawLine.trim();
      if (!t) return null;

      const leading = rawLine.length - rawLine.trimStart().length;

      const isIndented =
        leading >= 4 ||
        /^o[A-Za-z]/.test(t) || // olet, oVariable (attached, no space)
        /^o\s/.test(t);          // o Sub-topic (space after o)

      const cleaned = t
        .replace(/^[•\-–]\s*/, '')
        .replace(/^o\s+/, '')
        .replace(/^o(?=[A-Za-z])/, '')  // oLet → Let
        .replace(/^\d+[.)]\s+/, '')
        .trim();

      return {
        _id: crypto.randomUUID(), // frontend key only — stripped before API send
        text: cleaned || t,
        indent: isIndented ? 1 : 0,
      };
    })
    .filter(Boolean);
}

// ─── Full-week raw text parser ────────────────────────────────────────────────

/**
 * Matches day headers. Deliberately has NO $ anchor so it works for:
 *   "Day 1"
 *   "DAY 2"
 *   "Day 1 – HTML Basics: Build Your First Page"   (title on same line)
 *   "Day 5 & 6"
 *   "Day 5  &   Day 6"
 *   "Day 5 & Day 6"
 */
const DAY_RE = /^(?:DAY|Day)\s+(\d+)(?:\s*[&,]\s*(?:Day\s+)?(\d+))?(?:\s*[-–—:]\s*(.+))?/i;
const EXTRA_DAY_RE = /^Extra\s*Day\b/i;

function isBulletLine(t) {
  return /^[•\-–]\s/.test(t) || /^o[A-Za-z\s]/.test(t) || /^\d+[.)]\s/.test(t);
}

function isTaskHeader(t) {
  return /^Tasks?\b/i.test(t) && !isBulletLine(t);
}

function isTopicsHeader(t) {
  return /^Topics?(\s+Covered)?[.:]*\s*$/i.test(t);
}

function isObjectiveLine(t) {
  return /^Objective[:\s]*$/i.test(t);        // "Objective:" alone on a line
}

function isObjectiveInline(t) {
  return /^Objective:\s+\S/i.test(t);         // "Objective: Some text here"
}

function lineToItem(rawLine) {
  const t = rawLine.trim();
  if (!t) return null;

  const leading = rawLine.length - rawLine.trimStart().length;
  const isIndented =
    leading >= 4 ||
    /^o[A-Za-z]/.test(t) ||
    /^o\s/.test(t);

  const cleaned = t
    .replace(/^[•\-–]\s*/, '')
    .replace(/^o\s+/, '')
    .replace(/^o(?=[A-Za-z])/, '')
    .replace(/^\d+[.)]\s+/, '')
    .trim();

  return { _id: crypto.randomUUID(), text: cleaned || t, indent: isIndented ? 1 : 0 };
}

function parseDaySegment(lines, dayNum, isCompound, compoundEnd, inlineTitle) {
  let objective = '';
  let finalStep = '';
  const contentItems = [];
  const tasks = [];
  let section = 'content';
  let currentTask = null;
  let expectingObjectiveNextLine = false;

  for (const rawLine of lines) {
    const t = rawLine.trim();

    // Skip folder/file instruction lines
    if (!t || /^[📁📂]/.test(t)) continue;

    // "Objective:" alone on a line → next non-empty line is the objective text
    if (isObjectiveLine(t)) {
      expectingObjectiveNextLine = true;
      continue;
    }

    // "Objective: text here" — inline form
    if (isObjectiveInline(t)) {
      objective = t.replace(/^Objective:\s*/i, '').trim();
      expectingObjectiveNextLine = false;
      continue;
    }

    // Previous line was a bare "Objective:" — this line is the text
    if (expectingObjectiveNextLine) {
      objective = t;
      expectingObjectiveNextLine = false;
      continue;
    }

    // Topics header
    if (isTopicsHeader(t)) {
      section = 'content';
      continue;
    }

    // Final Step
    if (/^Final\s+Step\b/i.test(t)) {
      finalStep = t.replace(/^Final\s+Step[:\s–\-]*/i, '').trim();
      continue;
    }

    // Task header
    if (isTaskHeader(t)) {
      section = 'task';
      currentTask = { _id: crypto.randomUUID(), title: t, intro: '', items: [] };
      tasks.push(currentTask);
      continue;
    }

    // Route line to the active section
    if (section === 'content') {
      const item = lineToItem(rawLine);
      if (item) contentItems.push(item);
    } else if (section === 'task' && currentTask) {
      const item = lineToItem(rawLine);
      if (item) {
        currentTask.items.push(item);
      } else if (!currentTask.intro && currentTask.items.length === 0) {
        currentTask.intro = t;
      }
    }
  }

  const title = inlineTitle || (isCompound ? `Day ${dayNum} & ${compoundEnd}` : '');

  return {
    _id: crypto.randomUUID(),
    dayNumber: dayNum,
    isExtraDay: false,
    title,
    objective,
    contentItems,
    tasks,
    finalStep,
  };
}

function parseExtraDaySegment(lines) {
  // Extra Day: usually just a topics list, no tasks
  const contentItems = [];
  for (const rawLine of lines) {
    const t = rawLine.trim();
    if (!t || /^[📁📂]/.test(t)) continue;
    if (isTopicsHeader(t)) continue;
    const item = lineToItem(rawLine);
    if (item) contentItems.push(item);
  }
  return {
    _id: crypto.randomUUID(),
    dayNumber: 0,
    isExtraDay: true,
    title: 'Extra Day',
    objective: '',
    contentItems,
    tasks: [],
    finalStep: '',
  };
}

/**
 * Parse a full raw week paste into { week, topicsOverview, days[] }.
 * Works with all Code2Career week formats (Weeks 1–9+).
 */
export function parseFullWeek(raw) {
  const lines = raw.split('\n');

  // Week-level metadata from first ~8 lines
  let week = null;
  let topicsOverview = '';
  for (const line of lines.slice(0, 8)) {
    const wm = line.match(/WEEK\s*[:\t]\s*(\d+)/i);
    const tm = line.match(/TOPICS?\s*[:\t]\s*(.+)/i);
    if (wm) week = parseInt(wm[1]);
    if (tm) topicsOverview = tm[1].trim();
  }

  // Split into segments by day headers
  const segments = [];
  let current = null;

  for (const rawLine of lines) {
    const t = rawLine.trim();

    // Extra Day header
    if (EXTRA_DAY_RE.test(t)) {
      if (current) segments.push(current);
      current = { type: 'extra', lines: [] };
      continue;
    }

    // Regular day header
    const m = t.match(DAY_RE);
    if (m) {
      if (current) segments.push(current);
      current = {
        type: 'day',
        dayNum: parseInt(m[1]),
        isCompound: !!m[2],
        compoundEnd: m[2] ? parseInt(m[2]) : null,
        inlineTitle: m[3]?.trim() || '',
        lines: [],
      };
      continue;
    }

    if (current) current.lines.push(rawLine);
  }
  if (current) segments.push(current);

  const days = segments.map(seg => {
    if (seg.type === 'extra') return parseExtraDaySegment(seg.lines);
    return parseDaySegment(seg.lines, seg.dayNum, seg.isCompound, seg.compoundEnd, seg.inlineTitle);
  });

  return { week, topicsOverview, days };
}
