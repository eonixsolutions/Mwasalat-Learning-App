import { feesRepository } from './fees.repository.js';
import { AppError } from '../../utils/AppError.js';
import { uploadBuffer } from '../../config/cloudinary.js';
import { NOTIFICATION_TYPES, ROLES } from '../../constants/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const recomputeAccount = (account) => {
  const now = new Date();

  // Transition 'upcoming' → 'due' / 'overdue' based on dueDate
  account.installments = account.installments.map((inst) => {
    if (inst.status === 'upcoming') {
      if (inst.dueDate <= now) {
        inst.status = inst.dueDate < now ? 'overdue' : 'due';
      }
    }
    if (inst.status === 'due' && inst.dueDate < now) {
      inst.status = 'overdue';
    }
    return inst;
  });

  // Recalculate accessValidUntilWeek and totalPaid
  let accessWeeks = 0;
  let totalPaid = 0;
  for (const inst of account.installments) {
    if (inst.status === 'paid' || inst.status === 'waived') {
      accessWeeks += inst.weeksAccess;
      if (inst.status === 'paid') totalPaid += inst.amount;
    }
  }
  account.accessValidUntilWeek = accessWeeks;
  account.totalPaid = totalPaid;

  // Overall fee status
  const allPaid = account.installments.every(i => i.status === 'paid' || i.status === 'waived');
  const anyPaid = account.installments.some(i => i.status === 'paid' || i.status === 'waived');
  const anyOverdue = account.installments.some(i => i.status === 'overdue');
  if (allPaid) account.feeStatus = 'paid';
  else if (anyOverdue) account.feeStatus = 'overdue';
  else if (anyPaid) account.feeStatus = 'partial';
  else account.feeStatus = 'pending';

  return account;
};

// ── Fee Structure (admin) ─────────────────────────────────────────────────────

const getAllStructures = () => feesRepository.findAllStructures();

const getStructureByCourse = async (courseId) => {
  const structure = await feesRepository.findStructureByCourse(courseId);
  if (!structure) throw new AppError('No fee structure configured for this course', 404);
  return structure;
};

const upsertStructure = async (courseId, data, adminUserId) => {
  const { totalFee, installments, notes, currency } = data;

  if (!installments?.length) throw new AppError('At least one installment is required', 400);

  const sorted = [...installments].sort((a, b) => a.installmentNumber - b.installmentNumber);
  const computedTotal = sorted.reduce((sum, i) => sum + i.amount, 0);
  if (Math.abs(computedTotal - totalFee) > 1) {
    throw new AppError(`Installment amounts (${computedTotal}) do not add up to total fee (${totalFee})`, 400);
  }

  return feesRepository.upsertStructure(courseId, {
    totalFee,
    currency: currency ?? 'INR',
    installments: sorted,
    notes: notes ?? '',
    isActive: true,
    createdBy: adminUserId,
  });
};

// ── Fee Account ───────────────────────────────────────────────────────────────

// Called automatically when a student is approved
const createFeeAccount = async (studentId, courseId, enrollmentDate) => {
  const structure = await feesRepository.findStructureByCourse(courseId);
  if (!structure || !structure.isActive) return null; // no fee structure — skip

  const existingAccount = await feesRepository.findAccountByStudentId(studentId);
  if (existingAccount) return existingAccount; // already exists

  const baseDate = new Date(enrollmentDate ?? Date.now());

  const installments = structure.installments.map((def) => {
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + (def.dueAfterDays ?? 0));
    const now = new Date();
    const status = dueDate <= now ? 'due' : 'upcoming';
    return {
      installmentNumber: def.installmentNumber,
      label:             def.label || `Installment ${def.installmentNumber}`,
      amount:            def.amount,
      weeksAccess:       def.weeksAccess,
      dueDate,
      status,
    };
  });

  return feesRepository.createAccount({
    student:      studentId,
    course:       courseId,
    feeStructure: structure._id,
    totalFee:     structure.totalFee,
    currency:     structure.currency,
    installments,
    accessValidUntilWeek: 0,
    totalPaid: 0,
    feeStatus: 'pending',
  });
};

const getMyFeeAccount = async (userId) => {
  const Student = (await import('../student/student.model.js')).default;
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', 404);

  const account = await feesRepository.findAccountByStudent(student._id);
  if (!account) throw new AppError('No fee account found. Contact your coordinator.', 404);

  recomputeAccount(account);
  await account.save();
  return account;
};

const getFeeAccountByStudent = async (studentId) => {
  const account = await feesRepository.findAccountByStudent(studentId);
  if (!account) throw new AppError('No fee account found for this student', 404);
  recomputeAccount(account);
  await account.save();
  return account;
};

const getAllFeeAccounts = (feeStatus) => {
  const filter = feeStatus ? { feeStatus } : {};
  return feesRepository.findAllAccounts(filter);
};

// ── Payment submission (student) ──────────────────────────────────────────────

const submitInstallmentPayment = async (userId, installmentNumber, file, paymentData) => {
  const Student = (await import('../student/student.model.js')).default;
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', 404);

  const account = await feesRepository.findAccountByStudent(student._id);
  if (!account) throw new AppError('No fee account found', 404);

  recomputeAccount(account);

  const instIdx = account.installments.findIndex(i => i.installmentNumber === installmentNumber);
  if (instIdx === -1) throw new AppError('Installment not found', 404);

  const inst = account.installments[instIdx];
  if (inst.status === 'submitted') throw new AppError('A receipt is already under review for this installment', 400);
  if (inst.status === 'paid')      throw new AppError('This installment is already paid', 400);
  if (inst.status === 'waived')    throw new AppError('This installment has been waived', 400);
  if (inst.status === 'upcoming')  throw new AppError('This installment is not due yet', 400);

  // Upload receipt to Cloudinary
  const uploaded = await uploadBuffer(file.buffer, {
    folder: 'eonix/fee-receipts',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  });

  // Create payment record
  const Payment = (await import('../payment/payment.model.js')).default;
  const payment = await Payment.create({
    user:              userId,
    student:           student._id,
    type:              'course_fee',
    amount:            inst.amount,
    currency:          account.currency?.toLowerCase() ?? 'inr',
    status:            'pending_review',
    receiptUrl:        uploaded.secure_url,
    receiptPublicId:   uploaded.public_id,
    paymentMethod:     paymentData.paymentMethod,
    transactionId:     paymentData.transactionId ?? '',
    studentNote:       paymentData.studentNote ?? '',
    feeAccount:        account._id,
    installmentNumber,
  });

  // Update installment status
  account.installments[instIdx].status    = 'submitted';
  account.installments[instIdx].paymentId = payment._id;
  await account.save();

  // Notify coordinators and admins that a receipt was submitted
  const { notifyRole } = await import('../notification/notification.service.js');
  notifyRole([ROLES.BRANCH_COORDINATOR, ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN], {
    type:    NOTIFICATION_TYPES.FEE_PAYMENT_SUBMITTED,
    title:   'Fee Receipt Submitted',
    message: `${student.user?.name ?? 'A student'} submitted a payment receipt for ${inst.label || `Installment ${installmentNumber}`} (₹${inst.amount}). Please review and approve or reject the receipt.`,
    data:    { studentId: student._id, paymentId: payment._id, installmentNumber },
  }).catch(() => {});

  return payment;
};

// ── Payment approval (staff) ──────────────────────────────────────────────────

const getPendingInstallmentPayments = async () => {
  const Payment = (await import('../payment/payment.model.js')).default;
  return Payment.find({ type: 'course_fee', status: 'pending_review', feeAccount: { $ne: null } })
    .populate('user', 'name email phone')
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
    .sort({ createdAt: 1 });
};

const approveInstallmentPayment = async (paymentId, reviewerId) => {
  const Payment = (await import('../payment/payment.model.js')).default;
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.type !== 'course_fee') throw new AppError('Use the registration approval flow for registration fees', 400);
  if (payment.status !== 'pending_review') throw new AppError('Payment already reviewed', 400);

  const account = await feesRepository.findAccountByStudentId(payment.student);
  if (!account) throw new AppError('Fee account not found', 404);

  const instIdx = account.installments.findIndex(i => i.installmentNumber === payment.installmentNumber);
  if (instIdx === -1) throw new AppError('Installment not found on fee account', 404);

  // Approve payment
  payment.status     = 'approved';
  payment.reviewedBy = reviewerId;
  payment.reviewedAt = new Date();
  payment.paidAt     = new Date();
  await payment.save();

  // Update installment
  account.installments[instIdx].status = 'paid';
  account.installments[instIdx].paidAt = new Date();

  // Unlock next installment if it was 'upcoming' and dueDate has passed
  const nextInstIdx = account.installments.findIndex(i => i.installmentNumber === payment.installmentNumber + 1);
  if (nextInstIdx !== -1 && account.installments[nextInstIdx].status === 'upcoming') {
    const nextDue = new Date(account.installments[nextInstIdx].dueDate);
    if (nextDue <= new Date()) account.installments[nextInstIdx].status = 'due';
  }

  recomputeAccount(account);
  await account.save();

  // Notify student that their payment was approved
  const { notifyUser } = await import('../notification/notification.service.js');
  const Student = (await import('../student/student.model.js')).default;
  const studentDoc = await Student.findById(payment.student).select('user').lean();
  if (studentDoc?.user) {
    const inst = account.installments[instIdx];
    notifyUser(studentDoc.user, {
      type:       NOTIFICATION_TYPES.FEE_PAYMENT_APPROVED,
      title:      'Payment Approved!',
      message:    `Your payment for ${inst?.label || `Installment ${payment.installmentNumber}`} has been approved. You now have access up to Week ${account.accessValidUntilWeek}.`,
      data:       { installmentNumber: payment.installmentNumber, accessValidUntilWeek: account.accessValidUntilWeek },
      targetRole: 'student',
    }).catch(() => {});
  }

  return { payment, account };
};

const rejectInstallmentPayment = async (paymentId, reviewerId, reviewNote) => {
  const Payment = (await import('../payment/payment.model.js')).default;
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.type !== 'course_fee') throw new AppError('Use the registration rejection flow for registration fees', 400);
  if (payment.status !== 'pending_review') throw new AppError('Payment already reviewed', 400);

  const account = await feesRepository.findAccountByStudentId(payment.student);
  if (!account) throw new AppError('Fee account not found', 404);

  const instIdx = account.installments.findIndex(i => i.installmentNumber === payment.installmentNumber);

  payment.status     = 'rejected';
  payment.reviewedBy = reviewerId;
  payment.reviewedAt = new Date();
  payment.reviewNote = reviewNote ?? '';
  await payment.save();

  if (instIdx !== -1) {
    const inst = account.installments[instIdx];
    inst.status     = inst.dueDate < new Date() ? 'overdue' : 'due';
    inst.paymentId  = null;
    inst.reviewNote = reviewNote ?? null;
  }

  await account.save();

  // Notify student that their payment was rejected
  const { notifyUser: notifyRejected } = await import('../notification/notification.service.js');
  const StudentForReject = (await import('../student/student.model.js')).default;
  const studentDocR = await StudentForReject.findById(payment.student).select('user').lean();
  if (studentDocR?.user) {
    const rejectedInst = account.installments[instIdx];
    notifyRejected(studentDocR.user, {
      type:       NOTIFICATION_TYPES.FEE_PAYMENT_REJECTED,
      title:      'Payment Receipt Rejected',
      message:    `Your payment receipt for ${rejectedInst?.label || `Installment ${payment.installmentNumber}`} was rejected.${reviewNote ? ` Reason: ${reviewNote}` : ' Please resubmit a valid receipt.'}`,
      data:       { installmentNumber: payment.installmentNumber },
      targetRole: 'student',
    }).catch(() => {});
  }

  return payment;
};

export const feesService = {
  getAllStructures,
  getStructureByCourse,
  upsertStructure,
  createFeeAccount,
  getMyFeeAccount,
  getFeeAccountByStudent,
  getAllFeeAccounts,
  submitInstallmentPayment,
  getPendingInstallmentPayments,
  approveInstallmentPayment,
  rejectInstallmentPayment,
};
