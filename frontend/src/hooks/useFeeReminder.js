import { useState, useEffect } from 'react';
import { useAuth } from './useAuth.js';

const FEE_REMINDER_KEY = 'eonix_fee_reminder_dismissed';

export const useFeeReminder = (feeStatus) => {
  const { isStudent, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isStudent) return;
    if (feeStatus !== 'pending' && feeStatus !== 'overdue') return;

    const lastDismissed = localStorage.getItem(FEE_REMINDER_KEY);
    const today = new Date().toDateString();

    if (lastDismissed !== today) setShowModal(true);
  }, [isAuthenticated, isStudent, feeStatus]);

  const dismiss = () => {
    localStorage.setItem(FEE_REMINDER_KEY, new Date().toDateString());
    setShowModal(false);
  };

  return { showModal, dismiss };
};
