
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
      
      // Simple update query to set app_id for all users without it
      const { data, error } = await supabase
        .from('profiles')
        .update({ app_id: APP_ID })
        .or(`app_id.is.null,app_id.neq.${APP_ID}`)
        .select('id');
      
      if (error) throw error;
      
      const updatedCount = data?.length || 0;
      
      toast({
        title: "Migration completed",
        description: `Successfully updated ${updatedCount} users with app_id: ${APP_ID}`,
      });
      
      if (onComplete) {
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
      disabled={isRunning || userCount === 0}
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
