import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { feesService } from './fees.service.js';

// ── Admin: fee structure ──────────────────────────────────────────────────────

const getAllStructures = asyncHandler(async (req, res) => {
  const structures = await feesService.getAllStructures();
  successResponse(res, 'Fee structures fetched', structures);
});

const getStructureByCourse = asyncHandler(async (req, res) => {
  const structure = await feesService.getStructureByCourse(req.params.courseId);
  successResponse(res, 'Fee structure fetched', structure);
});

const upsertStructure = asyncHandler(async (req, res) => {
  const structure = await feesService.upsertStructure(req.params.courseId, req.body, req.user._id);
  successResponse(res, 'Fee structure saved', structure, 200);
});

// ── Student: fee account ──────────────────────────────────────────────────────

const getMyFeeAccount = asyncHandler(async (req, res) => {
  const account = await feesService.getMyFeeAccount(req.user._id);
  successResponse(res, 'Fee account fetched', account);
});

const submitInstallmentPayment = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Receipt image is required', data: null, error: {} });
  const installmentNumber = +req.params.installmentNumber;
  const payment = await feesService.submitInstallmentPayment(req.user._id, installmentNumber, req.file, req.body);
  successResponse(res, 'Payment receipt submitted for review', payment, 201);
});

// ── Staff: fee accounts overview ──────────────────────────────────────────────

const getAllFeeAccounts = asyncHandler(async (req, res) => {
  const accounts = await feesService.getAllFeeAccounts(req.query.feeStatus);
  successResponse(res, 'Fee accounts fetched', accounts);
});

const getFeeAccountByStudent = asyncHandler(async (req, res) => {
  const account = await feesService.getFeeAccountByStudent(req.params.studentId);
  successResponse(res, 'Fee account fetched', account);
});

// ── Staff: payment approval ───────────────────────────────────────────────────

const getPendingInstallmentPayments = asyncHandler(async (req, res) => {
  const payments = await feesService.getPendingInstallmentPayments();
  successResponse(res, 'Pending installment payments fetched', payments);
});

const approveInstallmentPayment = asyncHandler(async (req, res) => {
  const result = await feesService.approveInstallmentPayment(req.params.paymentId, req.user._id);
  successResponse(res, 'Payment approved — installment unlocked', result);
});

const rejectInstallmentPayment = asyncHandler(async (req, res) => {
  const { reviewNote } = req.body;
  const payment = await feesService.rejectInstallmentPayment(req.params.paymentId, req.user._id, reviewNote);
  successResponse(res, 'Payment rejected', payment);
});

export const feesController = {
  getAllStructures,
  getStructureByCourse,
  upsertStructure,
  getMyFeeAccount,
  submitInstallmentPayment,
  getAllFeeAccounts,
  getFeeAccountByStudent,
  getPendingInstallmentPayments,
  approveInstallmentPayment,
  rejectInstallmentPayment,
};
