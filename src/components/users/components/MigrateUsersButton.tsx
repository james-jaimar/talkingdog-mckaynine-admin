
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { migrateUsersToAppId } from '@/scripts/migrateUsersToAppId';
import { APP_ID } from '@/constants/app';

interface MigrateUsersButtonProps {
  onComplete?: () => Promise<void> | void;
  userCount?: number;
}

export function MigrateUsersButton({ onComplete, userCount = 0 }: MigrateUsersButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const handleMigrate = async () => {
    try {
      setIsRunning(true);
      console.log(`Starting migration of users to app_id: ${APP_ID}`);
      
      const result = await migrateUsersToAppId();
      
      toast({
        title: result.success ? "Migration completed" : "Migration failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      
      if (onComplete) {
        console.log("Migration process finished, triggering onComplete callback");
        await onComplete();
      }
    } catch (error) {
      console.error("Error during migration:", error);
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
      className="bg-amber-50 hover:bg-amber-100 border-amber-200" 
    >
      {isRunning ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Updating users...
        </>
      ) : (
        `Update ${userCount} users to app_id: ${APP_ID}`
      )}
    </Button>
  );
}
