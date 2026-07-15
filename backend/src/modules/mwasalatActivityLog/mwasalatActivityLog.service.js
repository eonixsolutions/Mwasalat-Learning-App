import MwasalatActivityLog from './mwasalatActivityLog.model.js';
import logger from '../../utils/logger.js';

// Fire-and-forget by convention — callers should never let a logging failure
// break the primary action (e.g. a login or a block/unblock). Each call site
// awaits this but the promise itself never rejects.
const record = async ({ actorId, actorName, actorRole, action, targetType, targetId, metadata }) => {
  try {
    await MwasalatActivityLog.create({
      actor: actorId, actorName, actorRole, action, targetType, targetId, metadata,
    });
  } catch (err) {
    logger.error(`[mwasalat-activity-log] Failed to record "${action}": ${err.message}`);
  }
};

const list = async ({ page = 1, limit = 30, action } = {}) => {
  const filter = action ? { action } : {};
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    MwasalatActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    MwasalatActivityLog.countDocuments(filter),
  ]);
  return { logs, total, page, pages: Math.ceil(total / limit) || 1 };
};

export const mwasalatActivityLogService = { record, list };
