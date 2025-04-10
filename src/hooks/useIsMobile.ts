
import { useState, useEffect } from "react";

// Mobile breakpoint consistent with Tailwind's md breakpoint
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Default to false and update after first render to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Handler to call on window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return isMobile;
}
