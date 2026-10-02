import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Editor mode = signed in to Supabase Auth. Writes are enforced server-side by the
 * row-level-security policies in supabase/setup.sql; this hook only drives the UI.
 */
export function useAuthLock() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setIsUnlocked(Boolean(data.session));
      setUserEmail(data.session?.user.email);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsUnlocked(Boolean(session));
      setUserEmail(session?.user.email);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const openUnlockModal = useCallback(() => {
    setErrorMsg(supabase ? '' : 'Supabase is not configured, so editor sign-in is unavailable.');
    setIsModalOpen(true);
  }, []);

  const closeUnlockModal = useCallback(() => {
    setIsModalOpen(false);
    setErrorMsg('');
  }, []);

  const unlock = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!supabase) {
      setErrorMsg('Supabase is not configured, so editor sign-in is unavailable.');
      return false;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      setErrorMsg(error.message);
      return false;
    }
    setIsModalOpen(false);
    return true;
  }, []);

  const lock = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return {
    isUnlocked,
    userEmail,
    isModalOpen,
    errorMsg,
    isSubmitting,
    openUnlockModal,
    closeUnlockModal,
    unlock,
    lock,
  };
}
