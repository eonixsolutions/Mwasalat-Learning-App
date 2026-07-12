import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const dayEntrySchema = new Schema(
  {
    day:         { type: Number, required: true, min: 1, max: 6 },
    status:      { type: String, enum: ['submitted', 'approved', 'corrections_requested'], default: 'submitted' },
    mentorNote:  { type: String, default: null, trim: true },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt:  { type: Date, default: null },
    reviewedBy:  { type: Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true }
);

const weekReviewSchema = new Schema(
  {
    student: { type: Types.ObjectId, ref: 'Student', required: true },
    week:    { type: Number, required: true, min: 1 },
    // Derived from day statuses — 'approved' only when all 6 days approved
    status:  {
      type: String,
      enum: ['in_progress', 'corrections_requested', 'approved'],
      default: 'in_progress',
    },
    days: { type: [dayEntrySchema], default: [] },
  },
  { timestamps: true }
);

// One review record per student per week
weekReviewSchema.index({ student: 1, week: 1 }, { unique: true });
weekReviewSchema.index({ status: 1 });
weekReviewSchema.index({ 'days.status': 1 });

const WeekReview = mongoose.model('WeekReview', weekReviewSchema);
export default WeekReview;
