import { useState, useEffect, useCallback } from 'react';

export const useIdle = (timeout: number, onIdle: () => void) => {
  const [isIdle, setIsIdle] = useState(false);

  const handleIdle = useCallback(() => {
    setIsIdle(true);
    onIdle();
  }, [onIdle]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(timer);
      timer = setTimeout(handleIdle, timeout);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    timer = setTimeout(handleIdle, timeout);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [timeout, handleIdle]);

  return isIdle;
};
