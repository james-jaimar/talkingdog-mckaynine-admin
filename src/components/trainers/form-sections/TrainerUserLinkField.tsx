import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2, Unlink, Loader2, User, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TrainerUserLinkFieldProps {
  trainerId: string;
  currentUserId: string | null | undefined;
  trainerEmail: string;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export function TrainerUserLinkField({ 
  trainerId, 
  currentUserId, 
  trainerEmail 
}: TrainerUserLinkFieldProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId || "");
  const [linkedUser, setLinkedUser] = useState<UserOption | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available users (trainers) that can be linked
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // First get all trainers with user_ids to know which are already linked
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('user_id')
          .not('user_id', 'is', null);

        if (trainersError) throw trainersError;

        const linkedUserIds = trainers?.map(t => t.user_id).filter(Boolean) || [];

        // Authorization is sourced from user_roles, not the legacy profiles.role field.
        const { data: trainerRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'trainer');

        if (rolesError) throw rolesError;

        const trainerUserIds = trainerRoles?.map(role => role.user_id) || [];
        const { data: profiles, error } = trainerUserIds.length > 0
          ? await supabase
          .from('profiles')
          .select('id, username, full_name, role')
          .in('id', trainerUserIds)
          : { data: [], error: null };

        if (error) throw error;

        let eligibleProfiles = profiles || [];

        // Keep a currently linked legacy account visible so an admin can repair or unlink it.
        if (currentUserId && !eligibleProfiles.some(profile => profile.id === currentUserId)) {
          const { data: currentProfile, error: currentProfileError } = await supabase
            .from('profiles')
            .select('id, username, full_name, role')
            .eq('id', currentUserId)
            .maybeSingle();

          if (currentProfileError) throw currentProfileError;
          if (currentProfile) {
            eligibleProfiles = [...eligibleProfiles, currentProfile];
          }
        }

        // Filter out already linked users (except the current one for this trainer)
        const availableUsers = eligibleProfiles
          .filter(p => !linkedUserIds.includes(p.id) || p.id === currentUserId)
          .map(p => ({
            id: p.id,
            email: p.username || '',
            full_name: p.full_name,
            role: p.role,
          }));

        setUsers(availableUsers);

        // Find and set the currently linked user
        if (currentUserId) {
          const linked = availableUsers.find(u => u.id === currentUserId);
          setLinkedUser(linked || null);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  const handleLink = async () => {
    if (!selectedUserId) return;

    setIsLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-role', {
        method: 'POST',
        body: {
          operation: 'linkTrainer',
          role: 'trainer',
          userId: selectedUserId,
          trainerId,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.details || data?.error || "Failed to link trainer account");

      const linkedUserData = users.find(u => u.id === selectedUserId);
      setLinkedUser(linkedUserData || null);

      toast({
        title: "User linked successfully",
        description: `Trainer is now linked to ${linkedUserData?.email || 'user account'}`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['trainers-list'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-admin'] });
    } catch (error) {
      console.error("Error linking user:", error);
      toast({
        title: "Failed to link user",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setIsLinking(true);
    try {
      const { error } = await supabase
        .from('trainers')
        .update({ user_id: null })
        .eq('id', trainerId);

      if (error) throw error;

      setLinkedUser(null);
      setSelectedUserId("");

      toast({
        title: "User unlinked",
        description: "Trainer has been unlinked from user account",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['trainers-list'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-admin'] });
    } catch (error) {
      console.error("Error unlinking user:", error);
      toast({
        title: "Failed to unlink user",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">User Account Link</span>
        </div>
        {linkedUser && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Linked
          </Badge>
        )}
      </div>

      {linkedUser ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background rounded-md border">
            <div>
              <p className="font-medium text-sm">{linkedUser.full_name || 'No name'}</p>
              <p className="text-xs text-muted-foreground">{linkedUser.email}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={isLinking}
              className="text-destructive hover:text-destructive"
            >
              {isLinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-1" />
                  Unlink
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This trainer can log in with the linked user credentials.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Link this trainer to a user account to enable login access.
          </p>
          
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : users.length > 0 ? (
            <div className="flex gap-2">
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a user account..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.full_name || user.email}</span>
                        <span className="text-xs text-muted-foreground">
                          ({user.email})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleLink}
                disabled={!selectedUserId || isLinking}
                size="sm"
              >
                {isLinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-1" />
                    Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-amber-600">
              No available trainer user accounts found. Create a user with the "Trainer" role first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
