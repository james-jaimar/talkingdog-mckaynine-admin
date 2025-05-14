
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useTermCacheInvalidation() {
  const queryClient = useQueryClient();
  const lastTermId = useRef<string | undefined>(undefined);
  
  // Centralized function to invalidate all term-dependent queries
  const invalidateTermDependentQueries = useCallback(async (termId: string | undefined) => {
    // More selective query invalidation
    await Promise.all([
      queryClient.removeQueries({ queryKey: ['classes', undefined, lastTermId.current], exact: false }),
      queryClient.removeQueries({ queryKey: ['class-schedules', lastTermId.current], exact: false }),
      queryClient.removeQueries({ queryKey: ['dashboard-stats', undefined, lastTermId.current], exact: false })
    ]);
    
    // Update the last term ID reference
    lastTermId.current = termId;
  }, [queryClient, lastTermId]);
  
  return { 
    lastTermId,
    invalidateTermDependentQueries 
  };
}
