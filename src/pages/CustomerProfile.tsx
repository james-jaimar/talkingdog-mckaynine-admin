
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

export default function CustomerProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  const { data: clientData, isLoading, refetch } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
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
          
        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching client data:", error);
        return null;
      }
    },
    enabled: !!user
  });

  const handleProfileUpdated = () => {
    refetch();
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
                ) : clientData ? (
                  <CustomerProfileForm 
                    client={clientData} 
                    onSuccess={handleProfileUpdated} 
                  />
                ) : (
                  <div className="py-4 text-center text-red-500">
                    Error loading profile. Please try again.
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
