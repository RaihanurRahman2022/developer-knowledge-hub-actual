import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'eng_hub_unlocked';
const UNLOCK_PASSWORD = 'vxrdms234uuzyAF';

export function useAuthLock() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync across tabs/windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setIsUnlocked(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const openUnlockModal = useCallback(() => {
    setErrorMsg('');
    setIsModalOpen(true);
  }, []);

  const closeUnlockModal = useCallback(() => {
    setIsModalOpen(false);
    setErrorMsg('');
  }, []);

  const unlock = useCallback((password: string): boolean => {
    if (password === UNLOCK_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsUnlocked(true);
      setIsModalOpen(false);
      setErrorMsg('');
      return true;
    } else {
      setErrorMsg('Incorrect unlock password. Please try again.');
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
  }, []);

  return {
    isUnlocked,
    isModalOpen,
    errorMsg,
    openUnlockModal,
    closeUnlockModal,
    unlock,
    lock,
  };
}
