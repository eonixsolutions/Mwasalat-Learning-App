import mongoose from 'mongoose';

const appUsageSchema = new mongoose.Schema(
  {
    student:       { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    date:          { type: Date, required: true },          // midnight UTC of the calendar day
    activeMinutes: { type: Number, default: 0, min: 0 },   // incremented 5 min per heartbeat
    lastHeartbeat: { type: Date, default: null },
  },
  { timestamps: true }
);

// One record per student per day
appUsageSchema.index({ student: 1, date: 1 }, { unique: true });
appUsageSchema.index({ date: 1 });

const AppUsage = mongoose.model('AppUsage', appUsageSchema);
export default AppUsage;
