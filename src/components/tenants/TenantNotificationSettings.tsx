
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenantNotifications } from "@/hooks/tenants/useTenantNotifications";
import { toast } from "@/components/ui/use-toast";

export function TenantNotificationSettings() {
  const { 
    notifications, 
    isLoading, 
    updateNotificationSettings,
    updateEmailTemplate
  } = useTenantNotifications();
  
  const [fromEmail, setFromEmail] = useState(notifications?.fromEmail || "");
  const [replyToEmail, setReplyToEmail] = useState(notifications?.replyToEmail || "");
  const [emailFooter, setEmailFooter] = useState(notifications?.emailFooter || "");
  
  // Email templates state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("welcome");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  
  // Notification toggles - Fix type issue by using boolean instead of literal true
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState<boolean>(notifications?.sendWelcomeEmail || true);
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState<boolean>(notifications?.sendInvoiceEmail || true);
  const [sendClassReminders, setSendClassReminders] = useState<boolean>(notifications?.sendClassReminders || true);
  const [sendPaymentReminders, setSendPaymentReminders] = useState<boolean>(notifications?.sendPaymentReminders || true);
  
  // Load template content when template selection changes
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    
    // Find the selected template in notifications
    const template = notifications?.emailTemplates?.find(t => t.type === value);
    if (template) {
      setTemplateSubject(template.subject);
      setTemplateContent(template.content);
    } else {
      // Default empty values
      setTemplateSubject("");
      setTemplateContent("");
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      await updateNotificationSettings({
        fromEmail,
        replyToEmail,
        emailFooter,
        sendWelcomeEmail,
        sendInvoiceEmail,
        sendClassReminders,
        sendPaymentReminders
      });
      
      toast({
        title: "Notification settings updated",
        description: "Your notification settings have been saved."
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Error updating settings",
        description: "There was a problem updating notification settings.",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveTemplate = async () => {
    try {
      await updateEmailTemplate(selectedTemplate, {
        subject: templateSubject,
        content: templateContent
      });
      
      toast({
        title: "Email template updated",
        description: `The ${selectedTemplate} email template has been saved.`
      });
    } catch (error) {
      console.error("Error updating email template:", error);
      toast({
        title: "Error updating template",
        description: "There was a problem updating the email template.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings">
        <TabsList className="mb-4">
          <TabsTrigger value="settings">Notification Settings</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email sender and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email Address</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="notifications@yourcompany.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reply-to-email">Reply-To Email Address</Label>
                    <Input
                      id="reply-to-email"
                      type="email"
                      value={replyToEmail}
                      onChange={(e) => setReplyToEmail(e.target.value)}
                      placeholder="support@yourcompany.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-footer">Email Footer Text</Label>
                  <Textarea
                    id="email-footer"
                    value={emailFooter}
                    onChange={(e) => setEmailFooter(e.target.value)}
                    placeholder="Company address, contact information, and unsubscribe instructions"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Preferences</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <Label htmlFor="welcome-email">Welcome Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Send a welcome email when new users are created
                        </p>
                      </div>
                      <Switch
                        id="welcome-email"
                        checked={sendWelcomeEmail}
                        onCheckedChange={(checked: boolean) => setSendWelcomeEmail(checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <Label htmlFor="invoice-email">Invoice Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Send emails when invoices are created or updated
                        </p>
                      </div>
                      <Switch
                        id="invoice-email"
                        checked={sendInvoiceEmail}
                        onCheckedChange={(checked: boolean) => setSendInvoiceEmail(checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <Label htmlFor="class-reminders">Class Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Send reminder emails before scheduled classes
                        </p>
                      </div>
                      <Switch
                        id="class-reminders"
                        checked={sendClassReminders}
                        onCheckedChange={(checked: boolean) => setSendClassReminders(checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pb-2">
                      <div>
                        <Label htmlFor="payment-reminders">Payment Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Send reminders for overdue payments
                        </p>
                      </div>
                      <Switch
                        id="payment-reminders"
                        checked={sendPaymentReminders}
                        onCheckedChange={(checked: boolean) => setSendPaymentReminders(checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Notification Settings"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize email templates sent to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Select Template</Label>
                  <Select 
                    value={selectedTemplate}
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger id="template-select" className="w-full">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome Email</SelectItem>
                      <SelectItem value="invoice">Invoice Email</SelectItem>
                      <SelectItem value="reminder">Class Reminder</SelectItem>
                      <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                      <SelectItem value="password_reset">Password Reset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-subject">Email Subject</Label>
                  <Input
                    id="template-subject"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    placeholder="Subject line for the email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="template-content">Email Content</Label>
                    <div className="text-xs text-muted-foreground">
                      You can use variables like {"{user_name}"} or {"{company_name}"}
                    </div>
                  </div>
                  <Textarea
                    id="template-content"
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    placeholder="Email content"
                    rows={10}
                    className="font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveTemplate} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
