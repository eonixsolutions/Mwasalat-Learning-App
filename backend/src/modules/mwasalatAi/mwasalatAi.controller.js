import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatAiService } from './mwasalatAi.service.js';

const ask = asyncHandler(async (req, res) => {
  const result = await mwasalatAiService.ask(req.mwasalatUser, req.body.question, req.body.history);
  successResponse(res, 'Answer generated', result);
});

export const mwasalatAiController = { ask };
