import nodemailer from 'nodemailer';
import logger from './logger.js';
import { AppError } from './AppError.js';

const isDev = process.env.NODE_ENV !== 'production';
const smtpReady = process.env.SMTP_HOST && process.env.SMTP_USER &&
  process.env.SMTP_PASS && process.env.SMTP_PASS !== 'your_app_password';

const transporter = smtpReady
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    if (isDev) {
      logger.warn(`[DEV] Email not sent (SMTP not configured). Would have sent "${subject}" to ${to}`);
      if (html) {
        const linkMatch = html.match(/href="([^"]+)"/);
        if (linkMatch) logger.warn(`[DEV] Link: ${linkMatch[1]}`);
      }
      return;
    }
    throw new AppError('Email service is not configured. Please contact support.', 500);
  }

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html, text });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    throw new AppError('Failed to send verification email. Please try again later.', 500);
  }
};
