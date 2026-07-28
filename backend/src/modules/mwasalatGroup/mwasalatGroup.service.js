import MwasalatGroup from './mwasalatGroup.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { AppError } from '../../utils/AppError.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import { mwasalatProgramService } from '../mwasalatProgram/mwasalatProgram.service.js';
import logger from '../../utils/logger.js';

const list = async () =>
  MwasalatGroup.find({}).sort({ name: 1 }).populate('department', 'name nameAr').populate('members', 'name email role');

const listActive = async () =>
  MwasalatGroup.find({ isActive: true }).sort({ name: 1 }).select('name nameAr department');

const validateMembers = async (memberIds) => {
  if (!Array.isArray(memberIds) || !memberIds.length) return [];
  const users = await MwasalatUser.find({ _id: { $in: memberIds } }).select('_id');
  if (users.length !== new Set(memberIds).size) {
    throw new AppError('One or more selected members do not exist', 400);
  }
  return memberIds;
};

const create = async ({ name, nameAr, description, department, members }, actor) => {
  if (!name?.trim()) throw new AppError('Group name is required', 400);

  const group = await MwasalatGroup.create({
    name: name.trim(),
    nameAr: nameAr?.trim() || undefined,
    description: description?.trim() || undefined,
    department: department || null,
    members: await validateMembers(members),
  });

  // A cohort can be targeted by a mandatory course (see targetGroups on
  // mwasalatProgram.model.js) before or after it has members — land anyone
  // already on the roster onto whatever mandatory courses already target it.
  if (group.members.length) {
    try {
      await mwasalatProgramService.syncMandatoryEnrollmentsForLearners(group.members, { groupIds: [group._id] });
    } catch (err) {
      logger.error(`[mwasalat-group] Mandatory auto-enroll failed after creating group ${group._id}: ${err.message}`);
    }
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'create_group', targetType: 'MwasalatGroup', targetId: group._id, metadata: { name: group.name },
  });

  return group;
};

const update = async (id, { name, nameAr, description, department, members, isActive }, actor) => {
  const group = await MwasalatGroup.findById(id);
  if (!group) throw new AppError('Group not found', 404);
  const previousMemberIds = new Set(group.members.map(String));

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('Group name is required', 400);
    group.name = name.trim();
  }
  if (nameAr !== undefined) group.nameAr = nameAr?.trim() || undefined;
  if (description !== undefined) group.description = description?.trim() || undefined;
  if (department !== undefined) group.department = department || null;
  if (members !== undefined) group.members = await validateMembers(members);
  if (isActive !== undefined) group.isActive = Boolean(isActive);
  await group.save();

  // Only newly added members need syncing — anyone already on the roster
  // before this update was already covered the first time they were added.
  const newlyAddedMembers = members !== undefined
    ? group.members.filter((m) => !previousMemberIds.has(String(m)))
    : [];
  if (newlyAddedMembers.length) {
    try {
      await mwasalatProgramService.syncMandatoryEnrollmentsForLearners(newlyAddedMembers, { groupIds: [group._id] });
    } catch (err) {
      logger.error(`[mwasalat-group] Mandatory auto-enroll failed after adding members to group ${group._id}: ${err.message}`);
    }
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'update_group', targetType: 'MwasalatGroup', targetId: group._id, metadata: { name: group.name },
  });

  return group;
};

const remove = async (id, actor) => {
  const group = await MwasalatGroup.findById(id);
  if (!group) throw new AppError('Group not found', 404);
  await group.deleteOne();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'delete_group', targetType: 'MwasalatGroup', targetId: group._id, metadata: { name: group.name },
  });

  return group;
};

export const mwasalatGroupService = { list, listActive, create, update, remove };
