import mongoose from 'mongoose';

const mwasalatConversationSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, trim: true },
  },
  { timestamps: true }
);

// One conversation per (learner, course) — matches the "per-course, private 1:1" scope.
mwasalatConversationSchema.index({ learner: 1, program: 1 }, { unique: true });
mwasalatConversationSchema.index({ instructor: 1, lastMessageAt: -1 });

const MwasalatConversation = mongoose.model('MwasalatConversation', mwasalatConversationSchema);
export default MwasalatConversation;
