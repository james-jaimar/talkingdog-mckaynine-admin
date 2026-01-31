import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Loader2, Settings as SettingsIcon, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { isPlatformAdmin, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { settings, isLoading, getSetting, updateSetting, isUpdating } = useSystemSettings();

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin && !isPlatformAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, isPlatformAdmin, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading settings...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin && !isPlatformAdmin) {
    return null;
  }

  const ioOfflineMode = getSetting('io_offline_mode') === true;
  const canEditSettings = isPlatformAdmin;

  return (
    <DashboardLayout>
      <Helmet>
        <title>System Settings</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure global application settings
            </p>
          </div>
        </div>

        {!canEditSettings && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Only Platform Admins can modify system settings. Contact your Platform Admin to make changes.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* InvoicesOnline Integration Settings */}
          <Card>
            <CardHeader>
              <CardTitle>InvoicesOnline Integration</CardTitle>
              <CardDescription>
                Configure how the system integrates with InvoicesOnline for invoice management and PDF generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="io-offline-mode" className="text-base font-medium">
                    IO Offline Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, the system uses local PDF generation instead of fetching from InvoicesOnline. 
                    Enable this if InvoicesOnline is unavailable or for testing purposes.
                  </p>
                </div>
                <Switch
                  id="io-offline-mode"
                  checked={ioOfflineMode}
                  onCheckedChange={(checked) => {
                    updateSetting({ key: 'io_offline_mode', value: checked });
                  }}
                  disabled={!canEditSettings || isUpdating}
                />
              </div>
              
              {ioOfflineMode && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> IO Offline Mode is enabled. Invoices will use locally-generated PDFs 
                    instead of official InvoicesOnline documents. This should only be used when IO is unavailable.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
