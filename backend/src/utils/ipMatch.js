// Minimal, dependency-free IPv4 allowlist matcher: supports exact IPs
// ("10.0.0.5") and CIDR ranges ("10.0.0.0/24"). IPv6 entries are matched by
// exact string equality only (no CIDR support) — sufficient for the
// corporate-network/VPN allowlisting this feature targets.

const ipv4ToInt = (ip) => {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    result = (result << 8) + n;
  }
  return result >>> 0;
};

// Node reports IPv4 clients as "::ffff:1.2.3.4" when the server also
// listens on IPv6 — normalize that back to plain IPv4 before comparing.
const normalizeIp = (ip) => {
  if (!ip) return ip;
  const mapped = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  return mapped ? mapped[1] : ip;
};

const matchesEntry = (ip, entry) => {
  const trimmed = entry.trim();
  if (!trimmed) return false;

  if (trimmed.includes('/')) {
    const [range, prefixStr] = trimmed.split('/');
    const prefix = Number(prefixStr);
    const rangeInt = ipv4ToInt(range);
    const ipInt = ipv4ToInt(ip);
    if (rangeInt === null || ipInt === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    if (prefix === 0) return true;
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (rangeInt & mask) === (ipInt & mask);
  }

  return ip === trimmed;
};

const isIpAllowed = (clientIp, allowedEntries = []) => {
  const ip = normalizeIp(clientIp);
  if (!ip) return false;
  return allowedEntries.some((entry) => matchesEntry(ip, entry));
};

export { isIpAllowed, normalizeIp };
