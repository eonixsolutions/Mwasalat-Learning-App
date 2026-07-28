import crypto from 'crypto';

// Self-hosted, storage-free math CAPTCHA: the correct answer + an expiry are
// AES-256-GCM encrypted into the token, so only this server (holding the key)
// can ever recover the answer — a client that just base64-decodes the token
// gets ciphertext, not the answer, and any tampering fails the auth tag check.
const SECRET = process.env.CAPTCHA_SECRET || process.env.JWT_ACCESS_SECRET;
const KEY = crypto.createHash('sha256').update(String(SECRET)).digest();
const TTL_MS = 5 * 60 * 1000;

const generateCaptcha = () => {
  const a = crypto.randomInt(1, 20);
  const b = crypto.randomInt(1, 20);
  const subtract = a > b && crypto.randomInt(0, 2) === 1;
  const question = subtract ? `${a} - ${b}` : `${a} + ${b}`;
  const answer = subtract ? a - b : a + b;
  const expiry = Date.now() + TTL_MS;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ answer, expiry }), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const token = Buffer.concat([iv, authTag, encrypted]).toString('base64url');

  return { question: `${question} = ?`, token };
};

const verifyCaptcha = (token, submittedAnswer) => {
  if (!token || submittedAnswer === undefined || submittedAnswer === null || submittedAnswer === '') return false;

  try {
    const raw = Buffer.from(token, 'base64url');
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    const { answer, expiry } = JSON.parse(decrypted);

    if (Date.now() > expiry) return false;
    return Number(submittedAnswer) === Number(answer);
  } catch {
    return false;
  }
};

export const mwasalatCaptcha = { generateCaptcha, verifyCaptcha };
