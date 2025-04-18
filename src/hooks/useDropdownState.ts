
import { useState, useCallback } from 'react';

export function useDropdownState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Ensure when setting isOpen to false, we also clean up any possible DOM issues
  const handleSetIsOpen = useCallback((state: boolean) => {
    setIsOpen(state);
    
    // If closing, ensure any potential DOM manipulations are reset
    if (state === false) {
      // Clean up any errant pointer-events styles that might have been set
      setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 50);
    }
  }, []);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
    setIsOpen: handleSetIsOpen
  };
}
