import mongoose from 'mongoose';

// Singleton document — there is only ever one settings row for the platform.
const mwasalatSettingsSchema = new mongoose.Schema(
  {
    platformName: { type: String, trim: true, default: 'Mwasalat Learning Platform' },
    supportEmail: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const MwasalatSettings = mongoose.model('MwasalatSettings', mwasalatSettingsSchema);
export default MwasalatSettings;
