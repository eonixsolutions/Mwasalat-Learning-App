import { useEffect } from 'react';
import mwasalatSocket from '../api/mwasalatSocket.js';

// The socket connection itself is owned by MwasalatChatBell / MwasalatNotificationBell
// (mounted for the whole session in the layout header) — this hook only joins/leaves
// the course's discussion room and wires up listeners while the panel is open.
export default function useMwasalatDiscussionSocket(programId, handlers) {
  useEffect(() => {
    if (!programId) return undefined;

    const handleThread = (thread) => handlers.onThread?.(thread);
    const handleReply = (payload) => handlers.onReply?.(payload);
    const handleThreadUpdated = (thread) => handlers.onThreadUpdated?.(thread);
    const handleThreadDeleted = (payload) => handlers.onThreadDeleted?.(payload);
    const handleReplyDeleted = (payload) => handlers.onReplyDeleted?.(payload);

    mwasalatSocket.emit('join-program-room', programId);
    mwasalatSocket.on('mwasalat:discussion:thread', handleThread);
    mwasalatSocket.on('mwasalat:discussion:reply', handleReply);
    mwasalatSocket.on('mwasalat:discussion:thread-updated', handleThreadUpdated);
    mwasalatSocket.on('mwasalat:discussion:thread-deleted', handleThreadDeleted);
    mwasalatSocket.on('mwasalat:discussion:reply-deleted', handleReplyDeleted);

    return () => {
      mwasalatSocket.emit('leave-program-room', programId);
      mwasalatSocket.off('mwasalat:discussion:thread', handleThread);
      mwasalatSocket.off('mwasalat:discussion:reply', handleReply);
      mwasalatSocket.off('mwasalat:discussion:thread-updated', handleThreadUpdated);
      mwasalatSocket.off('mwasalat:discussion:thread-deleted', handleThreadDeleted);
      mwasalatSocket.off('mwasalat:discussion:reply-deleted', handleReplyDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);
}
