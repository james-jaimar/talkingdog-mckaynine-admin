
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { migrateUsersToAppId } from '@/scripts/migrateUsersToAppId';
import { APP_ID } from '@/constants/app';

interface MigrateUsersButtonProps {
  onComplete?: () => Promise<void>;
}

export function MigrateUsersButton({ onComplete }: MigrateUsersButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const handleMigrate = async () => {
    try {
      setIsRunning(true);
      const result = await migrateUsersToAppId();
      
      toast({
        title: result.success ? "Migration completed" : "Migration failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      
      if (result.success && onComplete) {
        await onComplete();
      }
    } catch (error) {
      toast({
        title: "Migration failed",
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleMigrate} 
      disabled={isRunning}
    >
      {isRunning ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Updating users...
        </>
      ) : (
        `Fix missing app_id (${APP_ID})`
      )}
    </Button>
  );
}
