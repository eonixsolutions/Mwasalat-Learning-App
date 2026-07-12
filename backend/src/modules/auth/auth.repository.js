import User from '../user/user.model.js';
import Student from '../student/student.model.js';
import Course from '../course/course.model.js';
import Staff from '../staff/staff.model.js';

const findByEmail = (email) => User.findOne({ email });

const findByEmailWithPassword = (email) =>
  User.findOne({ email }).select('+password +refreshTokens');

const findByIdWithPassword = (id) =>
  User.findById(id).select('+password');

const findById = (id) => User.findById(id).select('+refreshTokens');

const create = (data) => User.create(data);

const findByVerificationToken = (token) => User.findOne({ emailVerificationToken: token });

const findByPasswordResetToken = (token) =>
  User.findOne({ passwordResetToken: token }).select('+passwordResetToken +passwordResetExpiry');

const markEmailVerified = (id) =>
  User.findByIdAndUpdate(id, { isEmailVerified: true, $unset: { emailVerificationToken: 1 } });

const addRefreshToken = (id, token) =>
  User.findByIdAndUpdate(id, { $push: { refreshTokens: { token } } });

const removeRefreshToken = (id, token) =>
  User.findByIdAndUpdate(id, { $pull: { refreshTokens: { token } } });

const setPasswordResetToken = (id, token, expiry) =>
  User.findByIdAndUpdate(id, { passwordResetToken: token, passwordResetExpiry: expiry });

const updatePassword = async (id, password) => {
  const user = await User.findById(id).select('+password');
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  return user.save();
};

const updateLastLogin = (id) => User.findByIdAndUpdate(id, { lastLogin: new Date() });

const addRoleToUser = (id, role) =>
  User.findByIdAndUpdate(id, { $addToSet: { roles: role } }, { new: true });

const removeRoleFromUser = (id, role) =>
  User.findByIdAndUpdate(id, { $pull: { roles: role } }, { new: true });

const createStudentProfile = (data) => Student.create(data);

const findStudentByUserId = (userId) =>
  Student.findOne({ user: userId, studentStatus: { $ne: 'dropped' } }).sort({ createdAt: -1 });

const findActiveCourseById = (id) => Course.findOne({ _id: id, isActive: true });

const createStaffProfile = (data) => Staff.create(data);

const findStaffByUserId = (userId) => Staff.findOne({ user: userId });

export const authRepository = {
  findByEmail,
  findByEmailWithPassword,
  findByIdWithPassword,
  findById,
  create,
  findByVerificationToken,
  findByPasswordResetToken,
  markEmailVerified,
  addRefreshToken,
  removeRefreshToken,
  setPasswordResetToken,
  updatePassword,
  updateLastLogin,
  addRoleToUser,
  removeRoleFromUser,
  createStudentProfile,
  findStudentByUserId,
  findActiveCourseById,
  createStaffProfile,
  findStaffByUserId,
};
