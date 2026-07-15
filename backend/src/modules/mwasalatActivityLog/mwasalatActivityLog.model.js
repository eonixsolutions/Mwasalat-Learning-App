import mongoose from 'mongoose';

const mwasalatActivityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser' },
    actorName: { type: String, trim: true },
    actorRole: { type: String, trim: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, trim: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

mwasalatActivityLogSchema.index({ createdAt: -1 });
mwasalatActivityLogSchema.index({ action: 1 });

const MwasalatActivityLog = mongoose.model('MwasalatActivityLog', mwasalatActivityLogSchema);
export default MwasalatActivityLog;
