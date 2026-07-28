import { z } from 'zod';

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
const nonEmptyPassword = z.string().min(1, 'Password is required');
const expectedRole = z.union([z.string(), z.array(z.string())]).optional();

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email,
  phone: z.string().trim().min(7, 'Enter a valid mobile number').max(30, 'Enter a valid mobile number'),
  password: nonEmptyPassword,
  consentAccepted: z.boolean().optional(),
  captchaToken: z.string().optional(),
  captchaAnswer: z.union([z.string(), z.number()]).optional(),
});

export const loginSchema = z.object({
  email,
  password: nonEmptyPassword,
  expectedRole,
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
  expectedRole,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: nonEmptyPassword,
  newPassword: nonEmptyPassword,
});

export const setPasswordSchema = z.object({
  password: nonEmptyPassword,
});

export const forgotPasswordSchema = z.object({
  email,
  captchaToken: z.string().optional(),
  captchaAnswer: z.union([z.string(), z.number()]).optional(),
});

export const resetPasswordSchema = z.object({
  email,
  otp: z.string().trim().min(1, 'Verification code is required'),
  password: nonEmptyPassword,
});

export const verifyTwoFactorLoginSchema = z.object({
  challengeToken: z.string().min(1, 'Challenge token is required'),
  token: z.string().min(1, 'Verification code is required'),
});

export const enableTwoFactorSchema = z.object({
  token: z.string().min(1, 'Verification code is required'),
});

export const disableTwoFactorSchema = z.object({
  password: nonEmptyPassword,
});

export const resetExpiredPasswordSchema = z.object({
  challengeToken: z.string().min(1, 'Challenge token is required'),
  newPassword: nonEmptyPassword,
});
