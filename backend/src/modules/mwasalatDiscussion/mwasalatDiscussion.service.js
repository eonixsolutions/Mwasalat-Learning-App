import MwasalatDiscussionThread from './mwasalatDiscussionThread.model.js';
import MwasalatDiscussionReply from './mwasalatDiscussionReply.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { AppError } from '../../utils/AppError.js';
import { emitToMwasalatProgramRoom } from '../../sockets/socket.js';

const loadProgramOrThrow = async (programId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  return program;
};

// Same circle who can already 1:1 chat about the course: the course's own
// instructor, any learner enrolled in it, and super admins.
const assertCourseAccess = async (program, user) => {
  if (user.role === MWASALAT_ROLES.SUPER_ADMIN) return;
  if (user.role === MWASALAT_ROLES.INSTRUCTOR) {
    if (String(program.instructor) === String(user._id)) return;
    throw new AppError('You do not have access to this course discussion', 403);
  }
  const enrollment = await MwasalatEnrollment.findOne({ learner: user._id, program: program._id });
  if (!enrollment) throw new AppError('You must be enrolled in this course to view its discussion', 403);
};

const canModerate = (program, user) =>
  user.role === MWASALAT_ROLES.SUPER_ADMIN
  || (user.role === MWASALAT_ROLES.INSTRUCTOR && String(program.instructor) === String(user._id));

const assertOwnerOrModerator = (item, program, user) => {
  const isOwner = String(item.author) === String(user._id);
  if (!isOwner && !canModerate(program, user)) {
    throw new AppError('You do not have permission to do this', 403);
  }
};

const listThreads = async (programId, user) => {
  const program = await loadProgramOrThrow(programId);
  await assertCourseAccess(program, user);
  const threads = await MwasalatDiscussionThread.find({ program: programId })
    .sort({ isPinned: -1, lastReplyAt: -1, createdAt: -1 });
  return { threads, canModerate: canModerate(program, user) };
};

const createThread = async (programId, user, { title, body }) => {
  if (!title?.trim()) throw new AppError('A title is required', 400);
  if (!body?.trim()) throw new AppError('A description is required', 400);
  const program = await loadProgramOrThrow(programId);
  await assertCourseAccess(program, user);

  const thread = await MwasalatDiscussionThread.create({
    program: programId,
    author: user._id,
    authorName: user.name,
    authorRole: user.role,
    title: title.trim(),
    body: body.trim(),
  });

  emitToMwasalatProgramRoom(programId, 'mwasalat:discussion:thread', thread);
  return thread;
};

const getThread = async (threadId, user) => {
  const thread = await MwasalatDiscussionThread.findById(threadId);
  if (!thread) throw new AppError('Question not found', 404);
  const program = await loadProgramOrThrow(thread.program);
  await assertCourseAccess(program, user);

  const replies = await MwasalatDiscussionReply.find({ thread: threadId }).sort({ createdAt: 1 });
  return { thread, replies, canModerate: canModerate(program, user) };
};

const addReply = async (threadId, user, body) => {
  if (!body?.trim()) throw new AppError('Reply cannot be empty', 400);
  const thread = await MwasalatDiscussionThread.findById(threadId);
  if (!thread) throw new AppError('Question not found', 404);
  const program = await loadProgramOrThrow(thread.program);
  await assertCourseAccess(program, user);

  const reply = await MwasalatDiscussionReply.create({
    thread: threadId,
    program: thread.program,
    author: user._id,
    authorName: user.name,
    authorRole: user.role,
    body: body.trim(),
  });

  thread.replyCount += 1;
  thread.lastReplyAt = reply.createdAt;
  await thread.save();

  emitToMwasalatProgramRoom(thread.program, 'mwasalat:discussion:reply', {
    threadId: String(threadId), reply, replyCount: thread.replyCount, lastReplyAt: thread.lastReplyAt,
  });
  return reply;
};

const deleteThread = async (threadId, user) => {
  const thread = await MwasalatDiscussionThread.findById(threadId);
  if (!thread) throw new AppError('Question not found', 404);
  const program = await loadProgramOrThrow(thread.program);
  await assertCourseAccess(program, user);
  assertOwnerOrModerator(thread, program, user);

  await Promise.all([
    MwasalatDiscussionReply.deleteMany({ thread: threadId }),
    thread.deleteOne(),
  ]);
  emitToMwasalatProgramRoom(thread.program, 'mwasalat:discussion:thread-deleted', { threadId: String(threadId) });
};

const deleteReply = async (replyId, user) => {
  const reply = await MwasalatDiscussionReply.findById(replyId);
  if (!reply) throw new AppError('Reply not found', 404);
  const program = await loadProgramOrThrow(reply.program);
  await assertCourseAccess(program, user);
  assertOwnerOrModerator(reply, program, user);

  await reply.deleteOne();
  const thread = await MwasalatDiscussionThread.findByIdAndUpdate(
    reply.thread, { $inc: { replyCount: -1 } }, { new: true }
  );

  emitToMwasalatProgramRoom(reply.program, 'mwasalat:discussion:reply-deleted', {
    threadId: String(reply.thread), replyId: String(replyId), replyCount: thread?.replyCount ?? 0,
  });
};

const togglePin = async (threadId, user) => {
  const thread = await MwasalatDiscussionThread.findById(threadId);
  if (!thread) throw new AppError('Question not found', 404);
  const program = await loadProgramOrThrow(thread.program);
  if (!canModerate(program, user)) throw new AppError('Only the instructor can pin questions', 403);

  thread.isPinned = !thread.isPinned;
  await thread.save();
  emitToMwasalatProgramRoom(thread.program, 'mwasalat:discussion:thread-updated', thread);
  return thread;
};

const toggleResolved = async (threadId, user) => {
  const thread = await MwasalatDiscussionThread.findById(threadId);
  if (!thread) throw new AppError('Question not found', 404);
  const program = await loadProgramOrThrow(thread.program);
  await assertCourseAccess(program, user);
  assertOwnerOrModerator(thread, program, user);

  thread.isResolved = !thread.isResolved;
  await thread.save();
  emitToMwasalatProgramRoom(thread.program, 'mwasalat:discussion:thread-updated', thread);
  return thread;
};

export const mwasalatDiscussionService = {
  listThreads, createThread, getThread, addReply, deleteThread, deleteReply, togglePin, toggleResolved,
};
