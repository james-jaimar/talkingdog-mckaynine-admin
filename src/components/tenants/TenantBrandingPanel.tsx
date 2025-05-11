
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "./branding/ColorPicker";
import { LogoUploader } from "./branding/LogoUploader";
import { useTenantBranding } from "@/hooks/tenants/useTenantBranding";
import { toast } from "@/components/ui/use-toast";

export function TenantBrandingPanel() {
  const { 
    branding, 
    isLoading, 
    updateBranding, 
    updateLogoUrl, 
    resetToDefaults 
  } = useTenantBranding();
  
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor || "#9b87f5");
  const [secondaryColor, setSecondaryColor] = useState(branding?.secondaryColor || "#7E69AB");
  const [accentColor, setAccentColor] = useState(branding?.accentColor || "#6E59A5");
  const [appName, setAppName] = useState(branding?.appName || "McKaynine Training");
  const [preview, setPreview] = useState(false);

  const handleSave = async () => {
    try {
      await updateBranding({
        primaryColor,
        secondaryColor,
        accentColor,
        appName
      });
      toast({
        title: "Branding updated",
        description: "Your branding changes have been saved.",
      });
    } catch (error) {
      console.error("Error updating branding:", error);
      toast({
        title: "Error updating branding",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefaults();
      setPrimaryColor("#9b87f5");
      setSecondaryColor("#7E69AB");
      setAccentColor("#6E59A5");
      setAppName("McKaynine Training");
      toast({
        title: "Defaults restored",
        description: "Branding has been reset to default settings.",
      });
    } catch (error) {
      console.error("Error resetting branding:", error);
      toast({
        title: "Error resetting branding",
        description: "There was an error resetting to default values. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant Branding</CardTitle>
          <CardDescription>
            Customize the appearance of your application for this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors">
            <TabsList>
              <TabsTrigger value="colors">Colors & Name</TabsTrigger>
              <TabsTrigger value="logos">Logos</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input 
                    id="app-name" 
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Color Scheme</h3>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <ColorPicker 
                      label="Primary Color"
                      color={primaryColor}
                      onChange={setPrimaryColor}
                    />
                    
                    <ColorPicker 
                      label="Secondary Color"
                      color={secondaryColor}
                      onChange={setSecondaryColor}
                    />
                    
                    <ColorPicker 
                      label="Accent Color"
                      color={accentColor}
                      onChange={setAccentColor}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Logos Tab */}
            <TabsContent value="logos" className="space-y-6 mt-4">
              <LogoUploader 
                currentLogoUrl={branding?.logoUrl}
                onLogoUploaded={updateLogoUrl}
              />
            </TabsContent>
            
            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-4">
              <div className="border p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  {branding?.logoUrl && (
                    <img 
                      src={branding.logoUrl} 
                      alt="Tenant logo" 
                      className="h-12 w-auto"
                    />
                  )}
                  <h2 className="text-xl font-bold">{appName}</h2>
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div 
                    className="h-16 w-16 rounded-md flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary
                  </div>
                  <div 
                    className="h-16 w-16 rounded-md flex items-center justify-center text-white"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary
                  </div>
                  <div 
                    className="h-16 w-16 rounded-md flex items-center justify-center text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Accent
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Button Style Preview</h4>
                    <div className="flex gap-2 mt-2">
                      <Button style={{ backgroundColor: primaryColor }}>
                        Primary Button
                      </Button>
                      <Button variant="outline" style={{ borderColor: secondaryColor, color: secondaryColor }}>
                        Secondary Button
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
