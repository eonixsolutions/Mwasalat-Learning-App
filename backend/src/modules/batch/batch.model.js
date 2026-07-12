import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    startDate:   { type: Date, required: true },
    endDate:     { type: Date, default: null },
    maxStudents: { type: Number, default: 30 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

batchSchema.index({ name: 1, branch: 1 }, { unique: true });
batchSchema.index({ branch: 1, isActive: 1 });
batchSchema.index({ course: 1 });

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
