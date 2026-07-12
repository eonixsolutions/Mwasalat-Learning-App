import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    durationWeeks: { type: Number, required: true },
    isActive:    { type: Boolean, default: true },
    reviewType:  { type: String, enum: ['none', 'screening', 'weekly'], default: 'none' },
    screenings:  [{
      part:       { type: Number, required: true },
      afterWeek:  { type: Number, required: true },
      bufferDays: { type: Number, default: 3 },
    }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

courseSchema.index({ isActive: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
