
import { useState, useEffect } from 'react';

// Custom hook to detect if the current viewport is mobile
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if screen width is below mobile breakpoint
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is a common mobile breakpoint
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}
