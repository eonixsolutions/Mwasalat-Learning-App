import mongoose from 'mongoose';

// Singleton document — there is only ever one settings row for the platform.
const mwasalatSettingsSchema = new mongoose.Schema(
  {
    platformName: { type: String, trim: true, default: 'Mwasalat Learning Platform' },
    supportEmail: { type: String, trim: true, default: '' },
    // IANA zone used for all org-local date/time logic (cron scheduling, "today"
    // boundaries, report bucketing, Zoom meeting display) — see backend/src/utils/orgTimezone.js.
    timezone: { type: String, trim: true, default: 'Asia/Muscat' },
    maintenanceMode: { type: Boolean, default: false },
    ipRestriction: {
      enabled: { type: Boolean, default: false },
      allowedIps: { type: [{ type: String, trim: true }], default: [] },
    },
    security: {
      // Account Lockout Policy — safe to leave on by default, it only ever
      // triggers after real repeated auth failures.
      maxLoginAttempts: { type: Number, default: 5, min: 3 },
      lockoutMinutes: { type: Number, default: 15, min: 1 },
      // Password Expiry Policy — 0 means disabled. Left disabled by default so
      // existing accounts on this shared deployment aren't force-expired the
      // moment an admin opens Settings; a super/platform admin opts in explicitly.
      passwordExpiryDays: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

const MwasalatSettings = mongoose.model('MwasalatSettings', mwasalatSettingsSchema);
export default MwasalatSettings;
