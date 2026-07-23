import { AppError } from './AppError.js';

// At least 8 chars, one uppercase, one lowercase, one digit.
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const assertStrongPassword = (password) => {
  if (!STRONG_PASSWORD_REGEX.test(password || '')) {
    throw new AppError(
      'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number',
      400
    );
  }
};
