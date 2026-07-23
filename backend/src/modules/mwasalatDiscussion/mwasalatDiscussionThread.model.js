import mongoose from 'mongoose';

const mwasalatDiscussionThreadSchema = new mongoose.Schema(
  {
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    // Denormalized (same convention as the activity log) so the thread list
    // never needs to populate + re-check a user that may since be blocked.
    authorName: { type: String, trim: true },
    authorRole: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    isPinned: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
    // Kept in sync by the reply service calls instead of a $lookup count on
    // every list fetch.
    replyCount: { type: Number, default: 0 },
    lastReplyAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Course discussion board listing — pinned first, then most recently active.
mwasalatDiscussionThreadSchema.index({ program: 1, isPinned: -1, lastReplyAt: -1, createdAt: -1 });

const MwasalatDiscussionThread = mongoose.model('MwasalatDiscussionThread', mwasalatDiscussionThreadSchema);
export default MwasalatDiscussionThread;
