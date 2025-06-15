import { useState, useCallback, useEffect } from 'react';

/**
 * useDropdownState hook manages isOpen state and ensures proper DOM cleanup,
 * esp. cleaning up pointer-events and adding safety when dropdown closes or
 * on component unmount. This prevents UI freezes due to pointer-events hanging
 * in an "off" state after a dropdown closes unexpectedly.
 */
export function useDropdownState(initialState = false) {
  const [isOpen, setIsOpenState] = useState(initialState);

  const setIsOpen = useCallback((state: boolean) => {
    setIsOpenState(state);
    // Debug logs for tracking dropdown state transitions
    if (typeof window !== "undefined") {
      if (state) {
        console.log("[Dropdown] OPENED");
      } else {
        console.log("[Dropdown] CLOSED: resetting body pointer events");
        document.body.style.pointerEvents = ""; // Defensive pointer-events cleanup
      }
    }
  }, []);

  const onOpen = useCallback(() => setIsOpen(true), [setIsOpen]);
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  const onToggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  // Ensure on dropdown close, pointer-events are always reset
  useEffect(() => {
    if (!isOpen) {
      document.body.style.pointerEvents = "";
    }
    // Also cleanup on unmount to prevent freeze on route change or force close
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, [isOpen]);

  return {
    isOpen,
    setIsOpen,
    onOpen,
    onClose,
    onToggle,
  };
}
