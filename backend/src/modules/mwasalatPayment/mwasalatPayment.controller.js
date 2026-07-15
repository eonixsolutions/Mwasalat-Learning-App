import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatPaymentService } from './mwasalatPayment.service.js';

const createCheckoutSession = asyncHandler(async (req, res) => {
  const result = await mwasalatPaymentService.createCheckoutSession(req.mwasalatUser._id, req.params.programId);
  successResponse(res, 'Checkout session created', result);
});

const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const result = await mwasalatPaymentService.handleWebhook(req.body, signature);
  res.json(result);
});

const confirmSession = asyncHandler(async (req, res) => {
  const result = await mwasalatPaymentService.confirmSession(req.mwasalatUser._id, req.params.sessionId);
  successResponse(res, 'Payment confirmed', result);
});

const listTransactions = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await mwasalatPaymentService.listTransactions({ page, limit });
  successResponse(res, 'Transactions fetched', result);
});

const getRevenueSummary = asyncHandler(async (req, res) => {
  const summary = await mwasalatPaymentService.getRevenueSummary();
  successResponse(res, 'Revenue summary fetched', summary);
});

const getSalesReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const report = await mwasalatPaymentService.getSalesReport({ from, to });
  successResponse(res, 'Sales report fetched', report);
});

const listReportTransactions = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const result = await mwasalatPaymentService.listTransactionsForReport({ from, to });
  successResponse(res, 'Report transactions fetched', result);
});

export const mwasalatPaymentController = {
  createCheckoutSession, webhook, confirmSession, listTransactions, getRevenueSummary,
  getSalesReport, listReportTransactions,
};
