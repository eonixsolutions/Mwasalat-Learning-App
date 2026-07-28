import MwasalatDepartment from './mwasalatDepartment.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { AppError } from '../../utils/AppError.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';

const list = async () => {
  const [departments, counts] = await Promise.all([
    MwasalatDepartment.find({}).sort({ name: 1 }),
    MwasalatUser.aggregate([
      { $match: { department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]),
  ]);
  const countById = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  return departments.map((d) => ({ ...d.toObject(), memberCount: countById[String(d._id)] ?? 0 }));
};

const listActive = () => MwasalatDepartment.find({ isActive: true }).sort({ name: 1 });

const create = async ({ name, nameAr, description, descriptionAr }, actor) => {
  if (!name?.trim()) throw new AppError('Department name is required', 400);

  const existing = await MwasalatDepartment.findOne({ name: name.trim() });
  if (existing) throw new AppError('A department with this name already exists', 409);

  const department = await MwasalatDepartment.create({
    name: name.trim(),
    nameAr: nameAr?.trim() || undefined,
    description: description?.trim() || undefined,
    descriptionAr: descriptionAr?.trim() || undefined,
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'create_department', targetType: 'MwasalatDepartment', targetId: department._id, metadata: { name: department.name },
  });

  return department;
};

const update = async (id, { name, nameAr, description, descriptionAr, isActive }, actor) => {
  const department = await MwasalatDepartment.findById(id);
  if (!department) throw new AppError('Department not found', 404);

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('Department name is required', 400);
    const existing = await MwasalatDepartment.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existing) throw new AppError('A department with this name already exists', 409);
    department.name = name.trim();
  }
  if (nameAr !== undefined) department.nameAr = nameAr?.trim() || undefined;
  if (description !== undefined) department.description = description?.trim() || undefined;
  if (descriptionAr !== undefined) department.descriptionAr = descriptionAr?.trim() || undefined;
  if (isActive !== undefined) department.isActive = Boolean(isActive);
  await department.save();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'update_department', targetType: 'MwasalatDepartment', targetId: department._id, metadata: { name: department.name },
  });

  return department;
};

const remove = async (id, actor) => {
  const department = await MwasalatDepartment.findById(id);
  if (!department) throw new AppError('Department not found', 404);

  const inUse = await MwasalatUser.countDocuments({ department: id });
  if (inUse > 0) {
    throw new AppError(`Cannot delete — ${inUse} user(s) are still assigned to this department. Deactivate it instead.`, 409);
  }

  await department.deleteOne();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'delete_department', targetType: 'MwasalatDepartment', targetId: department._id, metadata: { name: department.name },
  });

  return department;
};

export const mwasalatDepartmentService = { list, listActive, create, update, remove };
