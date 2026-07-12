import mongoose from 'mongoose';

const reviewSlotSchema = new mongoose.Schema(
  {
    review:       { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
    course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    reviewType:   { type: String, enum: ['screening', 'weekly'], required: true },
    part:         { type: Number, default: null },
    weekNumber:   { type: Number, default: null },
    scheduledAt:  { type: Date, required: true },
    meetingLink:  { type: String, trim: true, required: true },
    isBooked:        { type: Boolean, default: false },
    bookedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    holidayConflict: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSlotSchema.index({ review: 1, isBooked: 1 });
reviewSlotSchema.index({ course: 1, reviewType: 1, part: 1, weekNumber: 1 });
reviewSlotSchema.index({ isBooked: 1, scheduledAt: 1 });

const ReviewSlot = mongoose.model('ReviewSlot', reviewSlotSchema);
export default ReviewSlot;
