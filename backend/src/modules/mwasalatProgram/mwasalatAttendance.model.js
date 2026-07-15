import mongoose from 'mongoose';

const mwasalatAttendanceSchema = new mongoose.Schema(
  {
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    checkedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

mwasalatAttendanceSchema.index({ program: 1, learner: 1 }, { unique: true });

const MwasalatAttendance = mongoose.model('MwasalatAttendance', mwasalatAttendanceSchema);
export default MwasalatAttendance;
