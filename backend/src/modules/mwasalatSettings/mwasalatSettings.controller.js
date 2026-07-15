import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatSettingsService } from './mwasalatSettings.service.js';

const getSettings = asyncHandler(async (req, res) => {
  const settings = await mwasalatSettingsService.getSettings();
  successResponse(res, 'Settings fetched', settings);
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await mwasalatSettingsService.updateSettings(req.body, req.mwasalatUser);
  successResponse(res, 'Settings updated', settings);
});

export const mwasalatSettingsController = { getSettings, updateSettings };
