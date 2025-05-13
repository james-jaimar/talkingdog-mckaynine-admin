
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTenantSettings } from "@/hooks/tenants/useTenantSettings";
import { toast } from "@/components/ui/use-toast";

export function TenantGeneralSettings() {
  const { settings, isLoading, updateSettings } = useTenantSettings();
  
  const [name, setName] = useState(settings?.name || "");
  const [domain, setDomain] = useState(settings?.domain || "");
  const [contactEmail, setContactEmail] = useState(settings?.contactEmail || "");
  const [description, setDescription] = useState(settings?.description || "");
  const [isActive, setIsActive] = useState<boolean>(settings?.isActive || true);
  const [maxUsers, setMaxUsers] = useState(settings?.maxUsers?.toString() || "10");

  const handleSave = async () => {
    try {
      await updateSettings({
        name,
        domain,
        contactEmail,
        description,
        isActive,
        maxUsers: parseInt(maxUsers, 10)
      });
      
      toast({
        title: "Settings updated",
        description: "Tenant settings have been updated successfully."
      });
    } catch (error) {
      console.error("Error updating tenant settings:", error);
      toast({
        title: "Error updating settings",
        description: "There was a problem updating the tenant settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure the basic settings for this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Tenant Name</Label>
                <Input
                  id="tenant-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tenant name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tenant-domain">Domain</Label>
                <Input
                  id="tenant-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourcompany.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this tenant"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-users">Maximum Users</Label>
              <Input
                id="max-users"
                type="number"
                min="1"
                max="1000"
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of user accounts allowed for this tenant
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="tenant-active"
                checked={isActive}
                onCheckedChange={(checked: boolean) => setIsActive(checked)}
              />
              <Label htmlFor="tenant-active">Tenant Active</Label>
              <p className="text-sm text-muted-foreground ml-2">
                {isActive 
                  ? "Users can access this tenant" 
                  : "This tenant is currently disabled"
                }
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
