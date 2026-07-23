import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatActivityLogService } from './mwasalatActivityLog.service.js';

const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const result = await mwasalatActivityLogService.list({ page, limit, action: req.query.action });
  successResponse(res, 'Activity log fetched', result);
});

const onlineCount = asyncHandler(async (req, res) => {
  successResponse(res, 'Online count fetched', mwasalatActivityLogService.getOnlineCount());
});

export const mwasalatActivityLogController = { list, onlineCount };
