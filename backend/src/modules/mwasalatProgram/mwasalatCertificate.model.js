import mongoose from 'mongoose';

const mwasalatCertificateSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    issuedAt: { type: Date, default: Date.now },
    // Only set when the issuing program has a certificateValidityMonths — e.g. safety/
    // compliance certifications that must be renewed. Left unset means the certificate
    // never expires.
    expiresAt: { type: Date },
    // Marks that the "expires in 1 month" reminder has gone out, so the daily sweep
    // (sendCertificateExpiryReminders) doesn't email the learner again on every subsequent run.
    expiryReminderSentAt: { type: Date },
  },
  { timestamps: true }
);

mwasalatCertificateSchema.index({ learner: 1, program: 1 }, { unique: true });
mwasalatCertificateSchema.index({ expiresAt: 1, expiryReminderSentAt: 1 });
mwasalatCertificateSchema.index({ issuedAt: 1 });

const MwasalatCertificate = mongoose.model('MwasalatCertificate', mwasalatCertificateSchema);
export default MwasalatCertificate;
