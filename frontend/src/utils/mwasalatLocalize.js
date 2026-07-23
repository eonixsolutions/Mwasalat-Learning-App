const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

// Converts Western digits inside a string/number to Eastern Arabic-Indic
// numerals. Applied as a post-processing step on already-formatted output
// (prices, percentages, dates, timers) rather than relying on Intl
// numberingSystem support, which is inconsistent across browsers.
export function toArabicDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => ARABIC_DIGITS[d]);
}

export function localizeNumber(value, lang) {
  return lang?.startsWith('ar') ? toArabicDigits(value) : String(value);
}

// Picks the Arabic variant of a program field when present, else falls back
// to the base (English) field — used for title/description/category/
// subCategory/duration wherever a program is rendered.
export function getLocalizedProgramField(program, field, lang) {
  if (!program) return '';
  if (lang?.startsWith('ar')) {
    const arValue = program[`${field}Ar`];
    if (arValue?.trim()) return arValue;
  }
  return program[field] ?? '';
}
