import mongoose from 'mongoose';
import { STUDENT_STATUS } from '../../constants/index.js';

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    studentStatus: {
      type: String,
      enum: Object.values(STUDENT_STATUS),
      default: STUDENT_STATUS.ACTIVE,
    },
    isApproved: { type: Boolean, default: false },
    rollNumber: { type: Number, default: null },
    registrationFeePaid: { type: Boolean, default: false },
    enrollmentDate: { type: Date, default: Date.now },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    location: { type: String, default: null },
    educationQualification: {
      type: String,
      enum: ['12th', 'Graduation In Any Stream', 'Post Graduation', 'Other Qualification'],
      default: null,
    },
    mentorshipMode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
    },
    currentWeek: { type: Number, default: 1, min: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
    notes: { type: String, default: null },
    leetcodeHold: { type: Boolean, default: false },
    leetcodeUsername: { type: String, default: null, trim: true },
    leetcodeList: { type: String, enum: ['general', 'javascript'], default: 'general' },
    listSwitchDate: { type: Date, default: null },
    generalDaysCompleted: { type: Number, default: 0 },

    // Task sheet (OneDrive)
    microsoftEmail:         { type: String, default: null, trim: true },
    taskSheetUrl:           { type: String, default: null },
    taskSheetFolderId:      { type: String, default: null },
    taskSheetStatus:        { type: String, enum: ['none', 'provisioning', 'done', 'error'], default: 'none' },
    taskSheetProvisionedAt: { type: Date,   default: null },
    taskSheetFiles:         { type: [{ week: Number, day: Number, url: String }], default: [] },

    graduatedAt: { type: Date, default: null },
    isReEnrollment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studentSchema.index({ user: 1, course: 1 });
studentSchema.index({ branch: 1 });
studentSchema.index({ course: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ studentStatus: 1 });
studentSchema.index({ isApproved: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
