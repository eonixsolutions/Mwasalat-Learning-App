import { useEffect, useRef } from 'react';
import mwasalatSocket from '../api/mwasalatSocket.js';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';

// Same connect/join-room/disconnect-per-mount convention as useMwasalatSocket
// and useMwasalatChatSocket — this page owns its own socket lifecycle rather
// than sharing a global store, since admin chat has only one consumer (the
// admin chat page itself), unlike notifications/course-chat which need a
// persistent header bell.
export default function useMwasalatAdminChatSocket(onMessage) {
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleMessage = (payload) => handlerRef.current?.(payload);
    const handleConnect = () => {
      if (user?._id) mwasalatSocket.emit('join-room', user._id, user.role);
    };

    mwasalatSocket.on('mwasalat:adminChat:message', handleMessage);
    mwasalatSocket.on('connect', handleConnect);
    mwasalatSocket.connect();
    if (mwasalatSocket.connected) handleConnect();

    return () => {
      mwasalatSocket.off('mwasalat:adminChat:message', handleMessage);
      mwasalatSocket.off('connect', handleConnect);
      mwasalatSocket.disconnect();
    };
  }, [isAuthenticated, user?._id]);
}
