import Payment from './payment.model.js';
import Student from '../student/student.model.js';

const create         = (data)   => Payment.create(data);
const findById       = (id)     => Payment.findById(id).populate('user', 'name email').populate('student', 'course').populate('reviewedBy', 'name');
const findByStudent  = (studentId) => Payment.find({ student: studentId }).sort({ createdAt: -1 });
const findByUser     = (userId) => Payment.find({ user: userId }).sort({ createdAt: -1 });
const findPending    = ()       => Payment.find({ status: 'pending_review' })
  .populate('user', 'name email phone')
  .populate({ path: 'student', populate: [{ path: 'course', select: 'name' }, { path: 'branch', select: 'name location' }] })
  .sort({ createdAt: 1 });
const findAll        = ()       => Payment.find().populate('user', 'name email').populate('student', 'course').populate('reviewedBy', 'name').sort({ createdAt: -1 });

const approve = async (paymentId, reviewerId) => {
  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { status: 'approved', reviewedBy: reviewerId, reviewedAt: new Date(), paidAt: new Date() },
    { new: true }
  );
  if (payment?.type === 'registration_fee') {
    await Student.findByIdAndUpdate(payment.student, { registrationFeePaid: true });
  }
  return payment;
};

const reject = (paymentId, reviewerId, reviewNote) =>
  Payment.findByIdAndUpdate(
    paymentId,
    { status: 'rejected', reviewedBy: reviewerId, reviewNote, reviewedAt: new Date() },
    { new: true }
  );

const findPendingByStudent = (studentId) =>
  Payment.findOne({ student: studentId, status: 'pending_review', type: 'registration_fee' });

const countPending = () => Payment.countDocuments({ status: 'pending_review' });

export const paymentRepository = { create, findById, findByStudent, findByUser, findPending, findAll, approve, reject, countPending, findPendingByStudent };
