import { paymentRepository } from './payment.repository.js';
import { studentRepository } from '../student/student.repository.js';
import { authRepository } from '../auth/auth.repository.js';
import { AppError } from '../../utils/AppError.js';
import { uploadBuffer, deleteFile } from '../../config/cloudinary.js';
import { sendEmail } from '../../utils/mailer.js';
import { accountActivatedTemplate } from '../../utils/emailTemplates.js';
import { notifyUser } from '../notification/notification.service.js';
import { NOTIFICATION_TYPES } from '../../constants/index.js';

const REGISTRATION_FEE = 1000;

const submitProof = async (userId, file, { paymentMethod, transactionId, studentNote }) => {
  const student = await authRepository.findStudentByUserId(userId);
  if (!student) throw new AppError('Student profile not found', 404);
  if (student.registrationFeePaid) throw new AppError('Registration fee already approved', 400);

  const existing = await paymentRepository.findByUser(userId);
  const pending = existing.find(p => p.status === 'pending_review');
  if (pending) throw new AppError('A payment proof is already under review. Please wait for coordinator approval.', 400);

  const result = await uploadBuffer(file.buffer, {
    folder: 'eonix/payment-receipts',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  });

  return paymentRepository.create({
    user:            userId,
    student:         student._id,
    type:            'registration_fee',
    amount:          REGISTRATION_FEE,
    currency:        'inr',
    status:          'pending_review',
    receiptUrl:      result.secure_url,
    receiptPublicId: result.public_id,
    paymentMethod,
    transactionId:   transactionId ?? '',
    studentNote:     studentNote ?? '',
  });
};

const getMyPayments = (userId) => paymentRepository.findByUser(userId);

const getPending = () => paymentRepository.findPending();

const getAll = () => paymentRepository.findAll();

const approve = async (paymentId, reviewerId, batchId = null) => {
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) throw new AppError('Payment record not found', 404);
  if (payment.status !== 'pending_review') throw new AppError('This payment is not pending review', 400);

  const result = await paymentRepository.approve(paymentId, reviewerId);

  if (payment.type === 'registration_fee') {
    const studentId = payment.student?._id ?? payment.student;
    const student = await studentRepository.findById(studentId);

    if (student && !student.isApproved) {
      const effectiveBatchId = batchId || student.batch?._id || student.batch || null;
      const rollNumber = await studentRepository.getNextRollNumber(effectiveBatchId);
      const updateData = { isApproved: true, rollNumber };
      if (batchId) updateData.batch = batchId;
      await studentRepository.updateById(student._id, updateData);
    }

    const userEmail = student?.user?.email;
    const userName  = student?.user?.name;
    const userId    = student?.user?._id ?? student?.user;

    if (userEmail && userName) {
      await sendEmail({
        to: userEmail,
        subject: 'Your Eonix account is now active!',
        html: accountActivatedTemplate({ name: userName, loginUrl: `${process.env.CLIENT_URL}/login` }),
      }).catch(() => {});
    }

    if (userId) {
      await notifyUser(userId, {
        type:       NOTIFICATION_TYPES.ACCOUNT_ACTIVATED,
        title:      'Account Activated',
        message:    'Your registration has been approved. You can now log in and start your learning journey!',
        targetRole: 'student',
      }).catch(() => {});
    }

    // Create the course fee account
    const { feesService } = await import('../fees/fees.service.js');
    const courseId   = student.course?._id ?? student.course;
    const feeAccount = await feesService.createFeeAccount(student._id, courseId, student.enrollmentDate).catch(() => null);

    // For re-enrolled students the payment IS the first installment — mark it as paid immediately
    if (feeAccount && student.isReEnrollment) {
      const firstIdx = feeAccount.installments.findIndex(i => i.installmentNumber === 1);
      if (firstIdx !== -1) {
        feeAccount.installments[firstIdx].status    = 'paid';
        feeAccount.installments[firstIdx].paidAt    = new Date();
        feeAccount.installments[firstIdx].paymentId = result._id;
      }
      // Link the payment record to the fee account and mark it as installment 1
      const PaymentModel = (await import('./payment.model.js')).default;
      await PaymentModel.findByIdAndUpdate(paymentId, { feeAccount: feeAccount._id, installmentNumber: 1 });

      // Recompute totals inline (recomputeAccount is not exported from feesService)
      let accessWeeks = 0;
      let totalPaid   = 0;
      for (const inst of feeAccount.installments) {
        if (inst.status === 'paid' || inst.status === 'waived') {
          accessWeeks += inst.weeksAccess;
          if (inst.status === 'paid') totalPaid += inst.amount;
        }
      }
      feeAccount.accessValidUntilWeek = accessWeeks;
      feeAccount.totalPaid            = totalPaid;
      const allPaid   = feeAccount.installments.every(i => i.status === 'paid' || i.status === 'waived');
      const anyOverdue = feeAccount.installments.some(i => i.status === 'overdue');
      feeAccount.feeStatus = allPaid ? 'paid' : anyOverdue ? 'overdue' : totalPaid > 0 ? 'partial' : 'pending';

      await feeAccount.save().catch(() => {});
    }
  }

  return result;
};

const reject = async (paymentId, reviewerId, reviewNote) => {
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) throw new AppError('Payment record not found', 404);
  if (payment.status !== 'pending_review') throw new AppError('This payment is not pending review', 400);
  if (!reviewNote?.trim()) throw new AppError('A reason is required when rejecting a payment', 400);

  const result = await paymentRepository.reject(paymentId, reviewerId, reviewNote.trim());

  if (payment.type === 'registration_fee') {
    const studentId = payment.student?._id ?? payment.student;
    const student   = await studentRepository.findById(studentId);

    if (student && !student.isApproved) {
      // Mark the pending enrollment as dropped so it doesn't block a retry
      await studentRepository.updateById(student._id, {
        studentStatus: 'dropped',
        notes: `Registration rejected: ${reviewNote.trim()}`,
      });

      const userId = student?.user?._id ?? student?.user;
      if (userId) {
        await notifyUser(userId, {
          type:       NOTIFICATION_TYPES.FEE_PAYMENT_REJECTED,
          title:      'Enrollment Request Rejected',
          message:    `Your enrollment request was rejected. Reason: ${reviewNote.trim()}. You can submit a new request with a corrected receipt.`,
          targetRole: 'student',
        }).catch(() => {});
      }
    }
  }

  return result;
};

const pendingCount = () => paymentRepository.countPending();

export const paymentService = { submitProof, getMyPayments, getPending, getAll, approve, reject, pendingCount };
