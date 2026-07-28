import MwasalatSettings from './mwasalatSettings.model.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import { AppError } from '../../utils/AppError.js';

const isValidTimezone = (tz) => {
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const getSettings = async () => {
  let settings = await MwasalatSettings.findOne({});
  if (!settings) settings = await MwasalatSettings.create({});
  return settings;
};

const updateSettings = async ({ platformName, supportEmail, timezone, ipRestriction, maintenanceMode, security }, actor) => {
  let settings = await MwasalatSettings.findOne({});
  if (!settings) settings = new MwasalatSettings({});

  if (platformName !== undefined) settings.platformName = platformName;
  if (supportEmail !== undefined) settings.supportEmail = supportEmail;
  if (timezone !== undefined) {
    if (!isValidTimezone(timezone)) throw new AppError('Invalid timezone', 400);
    settings.timezone = timezone;
  }
  if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode === true || maintenanceMode === 'true';

  if (ipRestriction !== undefined) {
    if (ipRestriction.enabled !== undefined) settings.ipRestriction.enabled = ipRestriction.enabled;
    if (ipRestriction.allowedIps !== undefined) settings.ipRestriction.allowedIps = ipRestriction.allowedIps;
  }

  if (security !== undefined) {
    if (security.maxLoginAttempts !== undefined) settings.security.maxLoginAttempts = Math.max(3, Number(security.maxLoginAttempts) || 5);
    if (security.lockoutMinutes !== undefined) settings.security.lockoutMinutes = Math.max(1, Number(security.lockoutMinutes) || 15);
    if (security.passwordExpiryDays !== undefined) settings.security.passwordExpiryDays = Math.max(0, Number(security.passwordExpiryDays) || 0);
  }

  await settings.save();
  cachedSettings = null; // invalidate — next getCachedSettings() call re-reads the fresh row

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role, action: 'update_settings',
  });

  return settings;
};

// Login/register run this check on every request, so avoid a DB round-trip
// each time — cache the singleton row for a short TTL and invalidate it
// immediately on save above (admin's toggle takes effect within the TTL at worst).
let cachedSettings = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30 * 1000;

const getCachedSettings = async () => {
  if (cachedSettings && Date.now() - cachedAt < CACHE_TTL_MS) return cachedSettings;
  cachedSettings = await getSettings();
  cachedAt = Date.now();
  return cachedSettings;
};

export const mwasalatSettingsService = { getSettings, updateSettings, getCachedSettings };
