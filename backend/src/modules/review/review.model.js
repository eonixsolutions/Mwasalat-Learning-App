import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    reviewType:   { type: String, enum: ['screening', 'weekly'], required: true },
    part:         { type: Number, default: null },
    weekNumber:   { type: Number, default: null },
    status:       { type: String, enum: ['pending_slot', 'slot_booked', 'completed'], default: 'pending_slot' },
    slot:         { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewSlot', default: null },
    result:       { type: String, enum: ['pass', 'fail', null], default: null },
    marks:        { type: Number, default: null },
    remarks:      { type: String, trim: true, default: null },
    pendingTopics: { type: [String], default: [] },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:   { type: Date, default: null },
    earliestDate: { type: Date, default: null },
    attempt:      { type: Number, default: 1 },
  },
  { timestamps: true }
);

reviewSchema.index({ student: 1, course: 1, reviewType: 1 });
reviewSchema.index({ status: 1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
