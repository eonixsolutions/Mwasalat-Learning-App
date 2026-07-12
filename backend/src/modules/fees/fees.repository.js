import FeeStructure from './fee-structure.model.js';
import FeeAccount from './fee-account.model.js';

// ── FeeStructure ──────────────────────────────────────────────────────────────

const findStructureByCourse = (courseId) =>
  FeeStructure.findOne({ course: courseId }).populate('course', 'name slug');

const findAllStructures = () =>
  FeeStructure.find().populate('course', 'name slug').sort({ createdAt: -1 });

const upsertStructure = (courseId, data) =>
  FeeStructure.findOneAndUpdate(
    { course: courseId },
    { ...data, course: courseId },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('course', 'name slug');

// ── FeeAccount ────────────────────────────────────────────────────────────────

const createAccount = (data) => FeeAccount.create(data);

const findAccountByStudent = (studentId) =>
  FeeAccount.findOne({ student: studentId })
    .populate('feeStructure', 'notes')
    .populate('course', 'name slug');

const findAccountByStudentId = (studentId) => FeeAccount.findOne({ student: studentId });

const findAccountById = (id) =>
  FeeAccount.findById(id)
    .populate('student', 'user course')
    .populate('course', 'name slug');

const findAllAccounts = (filter = {}) =>
  FeeAccount.find(filter)
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
    .populate('course', 'name slug')
    .sort({ createdAt: -1 });

const updateAccountById = (id, data) =>
  FeeAccount.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const findPendingPaymentAccounts = () =>
  FeeAccount.find({ 'installments.status': 'submitted' })
    .populate({ path: 'student', populate: { path: 'user', select: 'name email phone' } })
    .populate('course', 'name slug')
    .sort({ updatedAt: -1 });

export const feesRepository = {
  findStructureByCourse,
  findAllStructures,
  upsertStructure,
  createAccount,
  findAccountByStudent,
  findAccountByStudentId,
  findAccountById,
  findAllAccounts,
  updateAccountById,
  findPendingPaymentAccounts,
};
