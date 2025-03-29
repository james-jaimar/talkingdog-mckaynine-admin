
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  email: string | null;
  capacity: number | null;
  admin_id: string | null;
  admin_name?: string;
  admin_avatar?: string;
  trainers_count: number;
}

export function BranchesTable() {
  const { data: branches, isLoading, error } = useQuery({
    queryKey: ["branches-with-trainers"],
    queryFn: async () => {
      // First query to get branches data
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("*");
      
      if (branchesError) throw branchesError;
      
      // Second query to get counts of trainers per branch
      const { data: trainerCounts, error: trainerCountError } = await supabase
        .from("trainers")
        .select('branch_id, count(*)', { count: 'exact' })
        .is('branch_id', 'not.null');
      
      if (trainerCountError) throw trainerCountError;
      
      // Get admin names from profiles table
      const adminIds = branchesData
        .filter(branch => branch.admin_id)
        .map(branch => branch.admin_id);
      
      let adminProfiles = {};
      if (adminIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", adminIds);
        
        if (profilesError) throw profilesError;
        
        // Create a map of admin_id to profile data
        adminProfiles = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
      
      // Create a map of branch_id to trainer count
      const countMap = {};
      trainerCounts.forEach(item => {
        if (item.branch_id) {
          countMap[item.branch_id] = parseInt(item.count);
        }
      });
      
      // Combine the data
      return branchesData.map((branch) => {
        const adminProfile = branch.admin_id ? adminProfiles[branch.admin_id] : null;
        
        return {
          ...branch,
          admin_name: adminProfile ? adminProfile.full_name : "Unassigned",
          admin_avatar: adminProfile ? adminProfile.avatar_url : null,
          trainers_count: countMap[branch.id] || 0
        };
      });
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-6">Loading branches...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">Error loading branches: {String(error)}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Branch Admin</TableHead>
            <TableHead>Trainers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches && branches.length > 0 ? (
            branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="bg-mckaynine-100 text-mckaynine-700">
                      <AvatarFallback>
                        <Building className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{branch.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{branch.city}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{branch.address}, {branch.postal_code}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {branch.email && <span className="text-sm">{branch.email}</span>}
                    {branch.phone && <span className="text-sm">{branch.phone}</span>}
                    {!branch.email && !branch.phone && <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell>{branch.capacity || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {branch.admin_avatar ? (
                        <AvatarImage src={branch.admin_avatar} />
                      ) : null}
                      <AvatarFallback className="bg-mckaynine-100 text-mckaynine-700">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{branch.admin_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-mckaynine-50 text-mckaynine-700 border-mckaynine-200">
                    {branch.trainers_count} trainers
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No branches found. Add your first branch to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
