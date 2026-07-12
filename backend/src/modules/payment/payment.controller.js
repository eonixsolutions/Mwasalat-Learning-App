import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { paymentService } from './payment.service.js';

const submitProof = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Receipt image is required', data: null, error: {} });
  const { paymentMethod, transactionId, studentNote } = req.body;
  const payment = await paymentService.submitProof(req.user._id, req.file, { paymentMethod, transactionId, studentNote });
  successResponse(res, 'Payment proof submitted successfully', payment, 201);
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getMyPayments(req.user._id);
  successResponse(res, 'Payments fetched', payments);
});

const getPending = asyncHandler(async (req, res) => {
  const payments = await paymentService.getPending();
  successResponse(res, 'Pending payments fetched', payments);
});

const getAll = asyncHandler(async (req, res) => {
  const payments = await paymentService.getAll();
  successResponse(res, 'All payments fetched', payments);
});

const approve = asyncHandler(async (req, res) => {
  const payment = await paymentService.approve(req.params.id, req.user._id, req.body.batchId ?? null);
  successResponse(res, 'Payment approved', payment);
});

const reject = asyncHandler(async (req, res) => {
  const payment = await paymentService.reject(req.params.id, req.user._id, req.body.reviewNote);
  successResponse(res, 'Payment rejected', payment);
});

export const paymentController = { submitProof, getMyPayments, getPending, getAll, approve, reject };
