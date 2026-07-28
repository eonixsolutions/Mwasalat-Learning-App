import { useEffect } from 'react';
import toast from 'react-hot-toast';
import mwasalatSocket from '../api/mwasalatSocket.js';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import { useMwasalatNotificationStore } from '../store/mwasalatNotificationStore.js';

export default function useMwasalatSocket() {
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const addNotification = useMwasalatNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNotification = (notification) => {
      addNotification({ ...notification, isRead: false });
      toast(notification.title, { icon: '🔔' });
    };

    const handleConnect = () => {
      if (user?._id) mwasalatSocket.emit('join-room', user._id, user.role);
    };

    mwasalatSocket.on('mwasalat:notification', handleNotification);
    mwasalatSocket.on('connect', handleConnect);
    mwasalatSocket.connect();
    if (mwasalatSocket.connected) handleConnect();

    return () => {
      mwasalatSocket.off('mwasalat:notification', handleNotification);
      mwasalatSocket.off('connect', handleConnect);
      mwasalatSocket.disconnect();
    };
  }, [isAuthenticated, user?._id, addNotification]);
}
