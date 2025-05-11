
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { TenantBrandingPanel } from "@/components/tenants/TenantBrandingPanel";
import { TenantGeneralSettings } from "@/components/tenants/TenantGeneralSettings";
import { TenantNotificationSettings } from "@/components/tenants/TenantNotificationSettings";

export default function TenantConfiguration() {
  const { isPlatformAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect non-platform-admin users
  useEffect(() => {
    if (!authLoading && !isPlatformAdmin) {
      navigate("/dashboard");
    }
  }, [isPlatformAdmin, authLoading, navigate]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Checking permissions...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPlatformAdmin) {
    return null; // Will be redirected
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Tenant Configuration</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tenant Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant settings, branding, and notifications
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <TenantGeneralSettings />
          </TabsContent>
          
          <TabsContent value="branding">
            <TenantBrandingPanel />
          </TabsContent>
          
          <TabsContent value="notifications">
            <TenantNotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
