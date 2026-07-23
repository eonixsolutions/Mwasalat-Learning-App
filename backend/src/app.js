import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import routes from './routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { mwasalatPaymentController } from './modules/mwasalatPayment/mwasalatPayment.controller.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());

// Unauthenticated liveness/readiness probe for uptime monitoring — kept outside
// /api so it skips the rate limiter and body parsers entirely.
const MONGOOSE_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
app.get('/health', (req, res) => {
  const dbState = MONGOOSE_STATES[mongoose.connection.readyState] || 'unknown';
  const isUp = mongoose.connection.readyState === 1;
  res.status(isUp ? 200 : 503).json({
    status: isUp ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    db: dbState,
    timestamp: new Date().toISOString(),
  });
});

// Stripe webhook needs the raw, unparsed body for signature verification —
// must be registered before the global express.json() parser below
app.post('/api/mwasalat-payments/webhook', express.raw({ type: 'application/json' }), mwasalatPaymentController.webhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use('/api', limiter);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
