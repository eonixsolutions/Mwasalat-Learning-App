import mongoose from 'mongoose';

const mwasalatCertificateSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

mwasalatCertificateSchema.index({ learner: 1, program: 1 }, { unique: true });

const MwasalatCertificate = mongoose.model('MwasalatCertificate', mwasalatCertificateSchema);
export default MwasalatCertificate;
