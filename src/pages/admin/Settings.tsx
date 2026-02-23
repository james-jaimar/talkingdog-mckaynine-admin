
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Map, UserCog, ScanLine, Settings as SettingsIcon, AlertTriangle } from "lucide-react";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// User Admin imports
import { UserAdminPanel } from "@/components/users/UserAdmin";
import { useAuth } from "@/context/auth";

// Branches imports
import { BranchesTable } from "@/components/branches/BranchesTable";
import { AddBranchModal } from "@/components/branches/AddBranchModal";

// Trainers imports
import { TrainersTable } from "@/components/trainers/TrainersTable";
import { AddTrainerModal } from "@/components/trainers/AddTrainerModal";

// System Settings
import { useSystemSettings } from "@/hooks/useSystemSettings";

// Intake Scans imports
import { useState as useIntakeState, useEffect } from "react";
import { UploadPanel } from "@/components/intake-scans/UploadPanel";
import { ReviewPanel } from "@/components/intake-scans/ReviewPanel";
import { StatusPanel } from "@/components/intake-scans/StatusPanel";
import { ScanProcessingJob, ExtractedData } from "@/components/intake-scans/types";
import { useProcessingJobs } from "@/components/intake-scans/hooks/useProcessingJobs";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

function IntakeScansTab() {
  const [selectedJob, setSelectedJob] = useIntakeState<ScanProcessingJob | null>(null);
  const [editedData, setEditedData] = useIntakeState<ExtractedData | null>(null);
  const { jobs, updateJob } = useProcessingJobs();

  useEffect(() => {
    if (selectedJob) {
      setEditedData(selectedJob.extracted_data || null);
    } else {
      setEditedData(null);
    }
  }, [selectedJob?.id, selectedJob?.extracted_data]);

  useEffect(() => {
    if (selectedJob) {
      const updatedJob = jobs.find(j => j.id === selectedJob.id);
      if (updatedJob && updatedJob.updated_at !== selectedJob.updated_at) {
        setSelectedJob(updatedJob);
      }
    }
  }, [jobs, selectedJob?.id]);

  const handleSelectJob = (job: ScanProcessingJob) => {
    setSelectedJob(job);
  };

  const debouncedUpdateJob = useDebouncedCallback(
    async (jobId: string, data: ExtractedData) => {
      await updateJob({
        id: jobId,
        updates: {
          extracted_data: data
        }
      });
    },
    500
  );

  const handleUpdateData = (data: ExtractedData) => {
    setEditedData(data);
    
    if (selectedJob) {
      debouncedUpdateJob(selectedJob.id, data);
    }
  };

  const handleProcessNext = () => {
    const nextJob = jobs.find(j => 
      j.id !== selectedJob?.id && 
      (j.status === 'needs_review' || j.status === 'ready_to_save' || j.status === 'queued')
    );
    
    if (nextJob) {
      setSelectedJob(nextJob);
    } else {
      setSelectedJob(null);
    }
  };

  return (
    <div className="h-[calc(100vh-16rem)]">
      <div className="mb-4">
        <p className="text-muted-foreground">
          Upload scanned enrollment forms to extract and import handler data
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-2rem)]">
        <div className="col-span-4 h-full min-w-0">
          <UploadPanel 
            onSelectJob={handleSelectJob}
            selectedJobId={selectedJob?.id || null}
          />
        </div>

        <div className="col-span-5 h-full">
          <ReviewPanel 
            job={selectedJob}
            onUpdateData={handleUpdateData}
          />
        </div>

        <div className="col-span-3 h-full">
          <StatusPanel 
            job={selectedJob}
            extractedData={editedData}
            onProcessNext={handleProcessNext}
          />
        </div>
      </div>
    </div>
  );
}

function SystemSettingsTab() {
  const { isPlatformAdmin } = useAuth();
  const { getSetting, updateSetting, isUpdating } = useSystemSettings();
  
  const ioOfflineMode = getSetting('io_offline_mode') === true;
  const canEditSettings = isPlatformAdmin;

  return (
    <div className="space-y-6">
      {!canEditSettings && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Only Platform Admins can modify system settings. Contact your Platform Admin to make changes.
          </AlertDescription>
        </Alert>
      )}

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
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');
  const { isPlatformAdmin } = useAuth();

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Admin - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Admin</h1>
            <p className="text-muted-foreground">
              Manage users, branches, trainers, and system settings
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="users" className="gap-2">
                <UserCog className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="branches" className="gap-2">
                <Map className="h-4 w-4" />
                Branches
              </TabsTrigger>
              <TabsTrigger value="trainers" className="gap-2">
                <Users className="h-4 w-4" />
                Trainers
              </TabsTrigger>
              <TabsTrigger value="intake-scans" className="gap-2">
                <ScanLine className="h-4 w-4" />
                Intake Scans
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">User Administration</h2>
                  <p className="text-muted-foreground">
                    {isPlatformAdmin 
                      ? "Manage all user accounts and assign roles (Platform Admin view)" 
                      : "Manage user accounts and assign roles for your branch"}
                  </p>
                </div>
                
                {isPlatformAdmin && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Platform Admin Access</CardTitle>
                      <CardDescription>
                        You have elevated privileges to manage all branches and users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>
                        As a Platform Admin, you can assign branch ownership and create other platform admins. 
                        Use this power responsibly as it grants full system access.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                <UserAdminPanel />
              </div>
            </TabsContent>

            <TabsContent value="branches">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Branches</h2>
                    <p className="text-muted-foreground">
                      Manage all training centre branches and their assigned trainers.
                    </p>
                  </div>
                  <AddBranchModal />
                </div>
                
                <Card className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle>All Branches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BranchesTable />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trainers">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Trainers</h2>
                    <p className="text-muted-foreground">
                      Manage all dog trainers across all branches.
                    </p>
                  </div>
                  <AddTrainerModal />
                </div>
                
                <Card className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle>All Trainers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TrainersTable />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="intake-scans">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Scanned Enrollment Forms</h2>
                </div>
                <IntakeScansTab />
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">System Settings</h2>
                  <p className="text-muted-foreground">
                    Configure global application settings
                  </p>
                </div>
                <SystemSettingsTab />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
