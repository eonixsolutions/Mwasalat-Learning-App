import mongoose from 'mongoose';

const mwasalatDiscussionReplySchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatDiscussionThread', required: true },
    // Denormalized off the thread so deleting/counting a reply never needs a
    // second lookup just to know which course it belongs to.
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    authorName: { type: String, trim: true },
    authorRole: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

mwasalatDiscussionReplySchema.index({ thread: 1, createdAt: 1 });

const MwasalatDiscussionReply = mongoose.model('MwasalatDiscussionReply', mwasalatDiscussionReplySchema);
export default MwasalatDiscussionReply;
