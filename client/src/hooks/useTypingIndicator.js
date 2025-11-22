import { useState, useCallback, useRef, useEffect } from 'react';

export const useTypingIndicator = (onTypingChange, delay = 1000) => {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef(null);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingChange(true);
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to stop typing
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingChange(false);
    }, delay);
  }, [isTyping, onTypingChange, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return handleTyping;
};

export default useTypingIndicator;
