import mongoose from 'mongoose';
import MwasalatConversation from './mwasalatConversation.model.js';
import MwasalatMessage from './mwasalatMessage.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import { AppError } from '../../utils/AppError.js';
import { emitToMwasalatUser } from '../../sockets/socket.js';

const assertEnrolled = async (learnerId, programId) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('You must be enrolled in this course to chat with the instructor', 403);
};

// Learner-initiated: chat with the instructor of a course they're enrolled in.
const getOrCreateAsLearner = async (learnerId, programId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  await assertEnrolled(learnerId, programId);

  const conversation = await MwasalatConversation.findOneAndUpdate(
    { learner: learnerId, program: programId },
    { learner: learnerId, program: programId, instructor: program.instructor },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate('instructor', 'name email')
    .populate('learner', 'name email')
    .populate('program', 'title category titleAr categoryAr');
  return conversation;
};

// Instructor-initiated: chat with a specific learner enrolled in one of their courses.
const getOrCreateAsInstructor = async (instructorId, programId, learnerId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  if (String(program.instructor) !== String(instructorId)) {
    throw new AppError('You do not have permission to message learners on this course', 403);
  }
  await assertEnrolled(learnerId, programId);

  const conversation = await MwasalatConversation.findOneAndUpdate(
    { learner: learnerId, program: programId },
    { learner: learnerId, program: programId, instructor: instructorId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate('instructor', 'name email')
    .populate('learner', 'name email')
    .populate('program', 'title category titleAr categoryAr');
  return conversation;
};

const assertParticipant = (conversation, userId) => {
  const isParticipant = String(conversation.learner) === String(userId) || String(conversation.instructor) === String(userId);
  if (!isParticipant) throw new AppError('You do not have access to this conversation', 403);
};

const otherParticipant = (conversation, userId) =>
  String(conversation.learner) === String(userId) ? conversation.instructor : conversation.learner;

const listMyConversations = async (userId) => {
  const conversations = await MwasalatConversation.find({ $or: [{ learner: userId }, { instructor: userId }] })
    .populate('learner', 'name email')
    .populate('instructor', 'name email')
    .populate('program', 'title category titleAr categoryAr')
    .sort({ lastMessageAt: -1 });

  const unreadCounts = await MwasalatMessage.aggregate([
    {
      $match: {
        conversation: { $in: conversations.map((c) => c._id) },
        read: false,
        sender: { $ne: new mongoose.Types.ObjectId(userId) },
      },
    },
    { $group: { _id: '$conversation', count: { $sum: 1 } } },
  ]);
  const unreadByConversation = Object.fromEntries(unreadCounts.map((u) => [u._id.toString(), u.count]));

  return conversations.map((c) => ({
    _id: c._id,
    learner: c.learner,
    instructor: c.instructor,
    program: c.program,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessagePreview,
    unreadCount: unreadByConversation[c._id.toString()] ?? 0,
  }));
};

const getMessages = async (conversationId, userId) => {
  const conversation = await MwasalatConversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);
  assertParticipant(conversation, userId);

  const messages = await MwasalatMessage.find({ conversation: conversationId }).sort({ createdAt: 1 });
  return { conversation, messages };
};

const sendMessage = async (conversationId, sender, text) => {
  if (!text?.trim()) throw new AppError('Message cannot be empty', 400);
  const userId = sender._id;

  const conversation = await MwasalatConversation.findById(conversationId).populate('program', 'title titleAr');
  if (!conversation) throw new AppError('Conversation not found', 404);
  assertParticipant(conversation, userId);

  const senderRole = String(conversation.learner) === String(userId) ? 'learner' : 'instructor';
  const message = await MwasalatMessage.create({
    conversation: conversationId, sender: userId, senderRole, text: text.trim(),
  });

  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessagePreview = message.text.slice(0, 140);
  await conversation.save();

  const recipientId = otherParticipant(conversation, userId);
  emitToMwasalatUser(recipientId, 'mwasalat:chat:message', {
    conversationId: conversation._id,
    message,
    senderName: sender.name,
    programTitle: conversation.program?.title,
  });

  return message;
};

const markRead = async (conversationId, userId) => {
  const conversation = await MwasalatConversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);
  assertParticipant(conversation, userId);

  await MwasalatMessage.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, read: false },
    { $set: { read: true } }
  );
};

export const mwasalatChatService = {
  getOrCreateAsLearner, getOrCreateAsInstructor, listMyConversations, getMessages, sendMessage, markRead,
};
