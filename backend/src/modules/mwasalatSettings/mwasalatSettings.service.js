import MwasalatSettings from './mwasalatSettings.model.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';

const getSettings = async () => {
  let settings = await MwasalatSettings.findOne({});
  if (!settings) settings = await MwasalatSettings.create({});
  return settings;
};

const updateSettings = async ({ platformName, supportEmail }, actor) => {
  let settings = await MwasalatSettings.findOne({});
  if (!settings) settings = new MwasalatSettings({});

  if (platformName !== undefined) settings.platformName = platformName;
  if (supportEmail !== undefined) settings.supportEmail = supportEmail;
  await settings.save();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role, action: 'update_settings',
  });

  return settings;
};

export const mwasalatSettingsService = { getSettings, updateSettings };
