
import { useState } from "react";
import { useAuth } from "@/context/auth";
import { DashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CustomerProfileForm } from "@/components/customer/CustomerProfileForm";
import { CustomerDogsList } from "@/components/customer/CustomerDogsList";
import { toast } from "sonner";

export default function CustomerProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  const { data: clientData, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        // First, check if a client record exists with this email
        const { data: clientByEmail, error: clientEmailError } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code,
            notes,
            dogs (
              id,
              name,
              breed,
              age,
              weight,
              date_of_birth,
              notes,
              behavior_notes,
              medical_notes,
              avatar_url
            )
          `)
          .eq('email', user.email)
          .single();
          
        if (!clientEmailError && clientByEmail) {
          console.log("Found client by email:", clientByEmail);
          return clientByEmail;
        }
        
        if (clientEmailError && clientEmailError.code !== 'PGRST116') {
          // PGRST116 means no rows returned, any other error is unexpected
          console.error("Error fetching client by email:", clientEmailError);
          throw clientEmailError;
        }
        
        // If no client found by email, check if user exists in profiles table with role = 'handler'
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw profileError;
        }
        
        // If user is a handler but no client record exists yet, create one
        if (userProfile?.role === 'handler') {
          console.log("User is a handler, creating client record");
          
          // Extract name from user metadata if available
          const fullName = user.user_metadata?.full_name || '';
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Create new client record for this handler
          const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert({
              email: user.email,
              first_name: firstName,
              last_name: lastName
            })
            .select(`
              id,
              first_name,
              last_name,
              email,
              phone,
              address,
              city,
              postal_code,
              notes,
              dogs:dogs (
                id,
                name,
                breed,
                age,
                weight,
                date_of_birth,
                notes,
                behavior_notes,
                medical_notes,
                avatar_url
              )
            `)
            .single();
            
          if (insertError) {
            console.error("Error creating client record:", insertError);
            throw insertError;
          }
          
          return newClient;
        }
        
        console.warn("User is not a handler and no client record exists");
        toast.error("Your account is not set up as a handler");
        return null;
      } catch (error) {
        console.error("Error in client data fetch:", error);
        toast.error("Failed to load profile data");
        return null;
      }
    },
    enabled: !!user
  });

  const handleProfileUpdated = () => {
    refetch();
    toast.success("Profile updated successfully");
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>My Profile - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="profile">Personal Info</TabsTrigger>
            <TabsTrigger value="dogs">My Dogs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your contact details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-4 text-center">Loading profile data...</div>
                ) : error ? (
                  <div className="py-4 text-center text-red-500">
                    Error loading profile: {error instanceof Error ? error.message : "Please try again"}
                  </div>
                ) : clientData ? (
                  <CustomerProfileForm 
                    client={clientData} 
                    onSuccess={handleProfileUpdated} 
                  />
                ) : (
                  <div className="py-4 text-center text-amber-600">
                    No profile data found. Please contact support if this issue persists.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dogs">
            <CustomerDogsList 
              clientId={clientData?.id}
              dogs={clientData?.dogs || []}
              isLoading={isLoading}
              onDogsUpdated={handleProfileUpdated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
