// At least 8 chars, one uppercase, one lowercase, one digit — mirrors the
// backend check in backend/src/utils/passwordPolicy.js.
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
