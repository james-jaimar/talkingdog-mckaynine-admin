
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BranchAdminFieldsProps {
  control: Control<any>;
}

export function BranchAdminFields({ control }: BranchAdminFieldsProps) {
  const { data: admins, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("role", "admin");
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Branch Administrator</div>
      
      <FormField
        control={control}
        name="adminId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Branch Admin
            </FormLabel>
            <FormControl>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || "none"} 
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an administrator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None assigned</SelectItem>
                  {admins?.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={admin.avatar_url || ""} alt={admin.full_name || admin.username} />
                          <AvatarFallback>
                            {(admin.full_name || admin.username || "?").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{admin.full_name || admin.username}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
