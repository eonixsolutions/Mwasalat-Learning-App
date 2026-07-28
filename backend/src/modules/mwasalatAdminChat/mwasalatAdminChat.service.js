import mongoose from 'mongoose';
import MwasalatAdminMessage from './mwasalatAdminMessage.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { AppError } from '../../utils/AppError.js';
import { emitToMwasalatUser } from '../../sockets/socket.js';

// Platform Admin is the hub: Super Admin escalates things Platform Admin
// can't see (revenue, etc.), Department Admin escalates things outside their
// department scope, Instructor/Supervisor/IT Support escalate things outside
// their own tools (account issues, platform questions). None of the spoke
// roles ever message each other directly — every pairing goes through
// Platform Admin.
const counterpartRolesFor = (actorRole) => {
  if (actorRole === MWASALAT_ROLES.SUPER_ADMIN) return [MWASALAT_ROLES.PLATFORM_ADMIN];
  if (actorRole === MWASALAT_ROLES.DEPARTMENT_ADMIN) return [MWASALAT_ROLES.PLATFORM_ADMIN];
  if (actorRole === MWASALAT_ROLES.INSTRUCTOR) return [MWASALAT_ROLES.PLATFORM_ADMIN];
  if (actorRole === MWASALAT_ROLES.SUPERVISOR) return [MWASALAT_ROLES.PLATFORM_ADMIN];
  if (actorRole === MWASALAT_ROLES.IT_SUPPORT) return [MWASALAT_ROLES.PLATFORM_ADMIN];
  if (actorRole === MWASALAT_ROLES.PLATFORM_ADMIN) {
    return [
      MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.DEPARTMENT_ADMIN, MWASALAT_ROLES.INSTRUCTOR,
      MWASALAT_ROLES.SUPERVISOR, MWASALAT_ROLES.IT_SUPPORT,
    ];
  }
  throw new AppError('You do not have access to admin chat', 403);
};

const assertValidCounterpart = async (actor, counterpartId) => {
  const expectedRoles = counterpartRolesFor(actor.role);
  const counterpart = await MwasalatUser.findById(counterpartId).populate('department', 'name nameAr');
  if (!counterpart || !expectedRoles.includes(counterpart.role)) {
    throw new AppError('You do not have permission to message this account', 403);
  }
  return counterpart;
};

// One row per counterpart (every Platform Admin for a spoke-role viewer, or
// every Super Admin + Department Admin + Instructor + Supervisor + IT
// Support for a Platform Admin viewer) — always listed even with no message
// history yet, so the channel is discoverable before first contact.
const listInbox = async (actor) => {
  const expectedRoles = counterpartRolesFor(actor.role);
  const counterparts = await MwasalatUser.find({ role: { $in: expectedRoles }, isActive: true })
    .select('name email role department')
    .populate('department', 'name nameAr')
    .lean();

  const actorId = new mongoose.Types.ObjectId(actor._id);
  const lastMessages = await MwasalatAdminMessage.aggregate([
    { $match: { $or: [{ sender: actorId }, { recipient: actorId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ['$sender', actorId] }, '$recipient', '$sender'] },
        lastMessageAt: { $first: '$createdAt' },
        lastMessagePreview: { $first: '$text' },
      },
    },
  ]);
  const lastByUser = Object.fromEntries(lastMessages.map((m) => [m._id.toString(), m]));

  const unread = await MwasalatAdminMessage.aggregate([
    { $match: { recipient: actorId, read: false } },
    { $group: { _id: '$sender', count: { $sum: 1 } } },
  ]);
  const unreadByUser = Object.fromEntries(unread.map((u) => [u._id.toString(), u.count]));

  return counterparts
    .map((u) => {
      const last = lastByUser[u._id.toString()];
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department ? { name: u.department.name, nameAr: u.department.nameAr } : null,
        lastMessageAt: last?.lastMessageAt ?? null,
        lastMessagePreview: last?.lastMessagePreview ?? null,
        unreadCount: unreadByUser[u._id.toString()] ?? 0,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt ?? 0) - new Date(a.lastMessageAt ?? 0));
};

const getThread = async (actor, counterpartId) => {
  const counterpart = await assertValidCounterpart(actor, counterpartId);
  const messages = await MwasalatAdminMessage.find({
    $or: [
      { sender: actor._id, recipient: counterpartId },
      { sender: counterpartId, recipient: actor._id },
    ],
  }).sort({ createdAt: 1 });
  return {
    counterpart: {
      _id: counterpart._id,
      name: counterpart.name,
      email: counterpart.email,
      role: counterpart.role,
      department: counterpart.department
        ? { name: counterpart.department.name, nameAr: counterpart.department.nameAr }
        : null,
    },
    messages,
  };
};

const sendMessage = async (actor, recipientId, text) => {
  if (!text?.trim()) throw new AppError('Message cannot be empty', 400);
  await assertValidCounterpart(actor, recipientId);

  const message = await MwasalatAdminMessage.create({
    sender: actor._id, recipient: recipientId, text: text.trim(),
  });

  emitToMwasalatUser(recipientId, 'mwasalat:adminChat:message', {
    message, senderId: actor._id, senderName: actor.name,
  });

  return message;
};

const markRead = async (actor, counterpartId) => {
  await MwasalatAdminMessage.updateMany(
    { sender: counterpartId, recipient: actor._id, read: false },
    { $set: { read: true } }
  );
};

export const mwasalatAdminChatService = { listInbox, getThread, sendMessage, markRead };
