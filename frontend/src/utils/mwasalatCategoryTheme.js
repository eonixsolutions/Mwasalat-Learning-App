// Deterministic category → color theme mapping so the same category always
// gets the same accent, without needing a color field from the backend.
const THEMES = [
  { bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500', ring: 'ring-mwasalatInk-200', solid: '#23181A' },
  { bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600', ring: 'ring-mwasalatRed-300', solid: '#C22033' },
  { bg: 'bg-[#EDE9FE]', text: 'text-[#7C6AF2]', ring: 'ring-[#DDD6FE]', solid: '#7C6AF2' },
  { bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]', ring: 'ring-[#FDE68A]', solid: '#F59E0B' },
  { bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]', ring: 'ring-[#BBF7D0]', solid: '#22C55E' },
];

export function themeForCategory(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return THEMES[hash % THEMES.length];
}
