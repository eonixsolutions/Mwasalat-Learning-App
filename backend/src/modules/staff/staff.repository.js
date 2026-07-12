import mongoose from 'mongoose';
import Staff from './staff.model.js';
import StaffInvite from './staffInvite.model.js';

// ── Staff ────────────────────────────────────────────────────────
const findStaffByUserId = (userId) => Staff.findOne({ user: userId });

const findStaffWithUserById = (id) => Staff.findById(id).populate('user', 'roles');

const findStaffById = (id) =>
  Staff.findById(id)
    .populate('user', 'name email phone isEmailVerified createdAt roles')
    .populate('branches', 'name code')
    .populate({ path: 'batches', select: 'name branch', populate: { path: 'branch', select: 'name code' } });

const updateStaffById = (id, data) => Staff.findByIdAndUpdate(id, data, { new: true });

const findStaffByBatchWithMicrosoftEmail = (batchId) =>
  Staff.find({ batches: batchId, isApproved: true, microsoftEmail: { $ne: null } })
    .select('microsoftEmail role');


const findMentorsByBatch = (batchId) => {
  const oid = new mongoose.Types.ObjectId(batchId.toString());
  return Staff.aggregate([
    { $match: { batches: oid, isApproved: true } },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.roles': 'technical_mentor' } },
    { $project: { user: { _id: '$user._id', name: '$user.name' } } },
  ]);
};

const findTechnicalMentorsWithEmailByBatches = (batchIds) =>
  Staff.find({
    batches: { $in: batchIds },
    isApproved: true,
    role: 'technical_mentor',
    microsoftEmail: { $ne: null },
  }).select('microsoftEmail batches');

const findAllStaff = (filter = {}, { skip = 0, limit = 20 } = {}) =>
  Staff.find(filter)
    .populate('user', 'name email phone isEmailVerified createdAt roles')
    .populate('invitedBy', 'name')
    .populate('branches', 'name code')
    .populate('batches', 'name branch')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

const countStaff = (filter = {}) => Staff.countDocuments(filter);

// Filters by user.roles array (authoritative source) instead of staff.role (original registration role)
const findAllStaffByRole = (role, filter = {}, { skip = 0, limit = 20 } = {}) =>
  Staff.aggregate([
    { $match: filter },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.roles': role } },
    {
      $lookup: {
        from: 'users',
        localField: 'invitedBy',
        foreignField: '_id',
        as: 'invitedBy',
        pipeline: [{ $project: { name: 1 } }],
      },
    },
    { $unwind: { path: '$invitedBy', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'branches',
        localField: 'branches',
        foreignField: '_id',
        as: 'branches',
        pipeline: [{ $project: { name: 1, code: 1 } }],
      },
    },
    {
      $lookup: {
        from: 'batches',
        localField: 'batches',
        foreignField: '_id',
        as: 'batches',
        pipeline: [{ $project: { name: 1, branch: 1 } }],
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        'user.password': 0,
        'user.refreshTokens': 0,
        'user.emailVerificationToken': 0,
        'user.passwordResetToken': 0,
        'user.passwordResetExpiry': 0,
      },
    },
  ]);

const countStaffByRole = (role, filter = {}) =>
  Staff.aggregate([
    { $match: filter },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.roles': role } },
    { $count: 'total' },
  ]).then((r) => r[0]?.total ?? 0);

// Used for approvals tab — only shows staff whose email is verified
const findVerifiedPendingStaff = (filter = {}, { skip = 0, limit = 20 } = {}) =>
  Staff.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $match: { 'user.isEmailVerified': true } },
    {
      $lookup: {
        from: 'users',
        localField: 'invitedBy',
        foreignField: '_id',
        as: 'invitedBy',
      },
    },
    { $unwind: { path: '$invitedBy', preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'branches',
        localField: 'branches',
        foreignField: '_id',
        as: 'branches',
        pipeline: [{ $project: { name: 1, code: 1 } }],
      },
    },
    {
      $lookup: {
        from: 'batches',
        localField: 'batches',
        foreignField: '_id',
        as: 'batches',
        pipeline: [{ $project: { name: 1, branch: 1 } }],
      },
    },
    {
      $project: {
        'user.password': 0,
        'user.refreshTokens': 0,
        'user.emailVerificationToken': 0,
        'user.passwordResetToken': 0,
        'user.passwordResetExpiry': 0,
        'user.role': 0,
      },
    },
  ]);

const countVerifiedPendingStaff = (filter = {}) =>
  Staff.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $match: { 'user.isEmailVerified': true } },
    { $count: 'total' },
  ]).then((r) => r[0]?.total ?? 0);

const createStaff = (data) => Staff.create(data);

// ── Invites ──────────────────────────────────────────────────────
const createInvite = (data) => StaffInvite.create(data);

const findInviteByToken = (token) =>
  StaffInvite.findOne({ token }).populate('createdBy', 'name').populate('usedBy', 'name email');

const findAllInvites = (filter = {}, { skip = 0, limit = 20 } = {}) =>
  StaffInvite.find(filter)
    .populate('createdBy', 'name')
    .populate('usedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

const countInvites = (filter = {}) => StaffInvite.countDocuments(filter);

const updateInviteById = (id, data) =>
  StaffInvite.findByIdAndUpdate(id, data, { new: true });

export const staffRepository = {
  findStaffByUserId,
  findStaffByBatchWithMicrosoftEmail,
  findMentorsByBatch,
  findTechnicalMentorsWithEmailByBatches,
  findStaffById,
  findStaffWithUserById,
  updateStaffById,
  findAllStaff,
  countStaff,
  findAllStaffByRole,
  countStaffByRole,
  findVerifiedPendingStaff,
  countVerifiedPendingStaff,
  createStaff,
  createInvite,
  findInviteByToken,
  findAllInvites,
  countInvites,
  updateInviteById,
};
