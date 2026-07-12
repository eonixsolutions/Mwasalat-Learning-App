import mongoose from 'mongoose';

const coordinatorSchema = new mongoose.Schema(
  {
    user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    branch:           { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
    designation:      { type: String, trim: true, default: null },
    isApproved:       { type: Boolean, default: false },
    approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt:       { type: Date, default: null },
    rejectionReason:  { type: String, trim: true, default: null },
    notes:            { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

coordinatorSchema.index({ isApproved: 1 });

const Coordinator = mongoose.model('Coordinator', coordinatorSchema);
export default Coordinator;
