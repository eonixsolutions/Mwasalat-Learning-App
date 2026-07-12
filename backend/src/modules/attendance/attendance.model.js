import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    date:     { type: Date, required: true },
    status:   { type: String, enum: ['present', 'half_day', 'absent', 'excused', 'late'], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note:     { type: String, trim: true, default: null },
    source:   { type: String, enum: ['manual'], default: 'manual' },
  },
  { timestamps: true }
);

// One record per student per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ student: 1, status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
