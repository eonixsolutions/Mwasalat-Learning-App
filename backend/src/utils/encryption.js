import crypto from 'crypto';

// Field-level AES-256-GCM encryption for sensitive values that must be
// reversible (unlike passwords, which are one-way hashed) — currently used
// for the 2FA TOTP secret, since verifying a code needs the raw seed back.
// Key is derived from JWT_ACCESS_SECRET via scrypt rather than a new env var,
// so this ships without requiring any additional secret provisioning.
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTED_PREFIX = 'enc:';

let cachedKey;
const getKey = () => {
  if (!cachedKey) {
    cachedKey = crypto.scryptSync(process.env.JWT_ACCESS_SECRET, 'mwasalat-field-encryption', 32);
  }
  return cachedKey;
};

export const encryptField = (plainText) => {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
};

// Values written before this encryption existed are stored as plain TOTP
// secrets with no prefix — returned as-is so existing 2FA enrollments keep
// working until the user re-enrolls (re-enrolling always re-encrypts).
export const decryptField = (value) => {
  if (!value || !value.startsWith(ENCRYPTED_PREFIX)) return value;
  try {
    const [ivB64, tagB64, dataB64] = value.slice(ENCRYPTED_PREFIX.length).split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return value;
  }
};
