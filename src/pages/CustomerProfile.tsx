import { useState } from "react";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerProfileTab } from "@/components/customer/CustomerProfileTab";
import { CustomerDogsList } from "@/components/customer/CustomerDogsList";
import { useCustomerProfileData } from "@/hooks/useCustomerProfileData";

export default function CustomerProfile() {
  const [activeTab, setActiveTab] = useState("profile");
  const { clientData, isLoading, error, handleProfileUpdated } = useCustomerProfileData();

  return (
    <CustomerDashboardLayout>
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
            <CustomerProfileTab 
              clientData={clientData}
              isLoading={isLoading}
              error={error}
              onSuccess={handleProfileUpdated}
            />
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
    </CustomerDashboardLayout>
  );
}
