import MwasalatCategory from './mwasalatCategory.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import { PROGRAM_STATUS } from '../mwasalatProgram/mwasalatProgram.constants.js';
import { AppError } from '../../utils/AppError.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import logger from '../../utils/logger.js';

// First admin visit to the category manager backfills the taxonomy from whatever
// free-text category strings existing courses already use, so the picker doesn't
// start empty and force re-typing names that were already in use.
const ensureSeeded = async () => {
  const count = await MwasalatCategory.countDocuments({});
  if (count > 0) return;

  const distinctNames = await MwasalatProgram.distinct('category');
  const rows = distinctNames.filter((name) => name?.trim()).map((name) => ({ name: name.trim() }));
  if (rows.length) await MwasalatCategory.insertMany(rows, { ordered: false }).catch(() => {});
};

const list = async () => {
  await ensureSeeded();

  const [categories, counts] = await Promise.all([
    MwasalatCategory.find({}).sort({ name: 1 }),
    MwasalatProgram.aggregate([
      { $match: { status: { $ne: PROGRAM_STATUS.ARCHIVED } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);
  const countByName = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  return categories.map((c) => ({ ...c.toObject(), programCount: countByName[c.name] ?? 0 }));
};

const listActive = async () => {
  await ensureSeeded();
  return MwasalatCategory.find({ isActive: true }).sort({ name: 1 });
};

const normalizeSubCategories = (subCategories) => {
  if (!Array.isArray(subCategories)) return undefined;
  return subCategories
    .map((s) => (typeof s === 'string' ? { name: s.trim() } : { name: s?.name?.trim(), nameAr: s?.nameAr?.trim() || undefined }))
    .filter((s) => s.name);
};

const create = async ({ name, nameAr, description, descriptionAr, subCategories }, actor) => {
  if (!name?.trim()) throw new AppError('Category name is required', 400);

  const existing = await MwasalatCategory.findOne({ name: name.trim() });
  if (existing) throw new AppError('A category with this name already exists', 409);

  const category = await MwasalatCategory.create({
    name: name.trim(),
    nameAr: nameAr?.trim() || undefined,
    description: description?.trim() || undefined,
    descriptionAr: descriptionAr?.trim() || undefined,
    subCategories: normalizeSubCategories(subCategories) ?? [],
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'create_category', targetType: 'MwasalatCategory', targetId: category._id, metadata: { name: category.name },
  });

  return category;
};

const update = async (id, { name, nameAr, description, descriptionAr, subCategories, isActive }, actor) => {
  const category = await MwasalatCategory.findById(id);
  if (!category) throw new AppError('Category not found', 404);

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('Category name is required', 400);
    const existing = await MwasalatCategory.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existing) throw new AppError('A category with this name already exists', 409);
    category.name = name.trim();
  }
  if (nameAr !== undefined) category.nameAr = nameAr?.trim() || undefined;
  if (description !== undefined) category.description = description?.trim() || undefined;
  if (descriptionAr !== undefined) category.descriptionAr = descriptionAr?.trim() || undefined;
  if (subCategories !== undefined) category.subCategories = normalizeSubCategories(subCategories) ?? [];
  if (isActive !== undefined) category.isActive = Boolean(isActive);
  await category.save();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'update_category', targetType: 'MwasalatCategory', targetId: category._id, metadata: { name: category.name },
  });

  return category;
};

const remove = async (id, actor) => {
  const category = await MwasalatCategory.findById(id);
  if (!category) throw new AppError('Category not found', 404);

  const inUse = await MwasalatProgram.countDocuments({ category: category.name });
  if (inUse > 0) {
    throw new AppError(`Cannot delete — ${inUse} course(s) still use this category. Deactivate it instead.`, 409);
  }

  await category.deleteOne();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'delete_category', targetType: 'MwasalatCategory', targetId: category._id, metadata: { name: category.name },
  });

  return category;
};

// Heuristic fallback when Gemini is unconfigured/fails — same degrade-gracefully
// convention as aiAutofill in mwasalatProgram.service.js. Dynamically imported to
// avoid a module cycle (mwasalatAi's admin tools import Mwasalat models/services).
const suggest = async (name) => {
  if (!name?.trim()) throw new AppError('Category name is required', 400);
  const trimmed = name.trim();

  try {
    const { mwasalatAiService } = await import('../mwasalatAi/mwasalatAi.service.js');
    return await mwasalatAiService.suggestCategoryDetails(trimmed);
  } catch (err) {
    logger.warn(`[mwasalat-category] AI suggest fell back to heuristic: ${err.message}`);
    return {
      description: `Training courses related to ${trimmed}, organized under Mwasalat's standardised learning taxonomy.`,
      subCategories: ['General', 'Fundamentals', 'Advanced Topics'],
    };
  }
};

export const mwasalatCategoryService = { list, listActive, create, update, remove, suggest };
