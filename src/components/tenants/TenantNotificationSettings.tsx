
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTenantNotifications } from "@/hooks/tenants/useTenantNotifications";
import { toast } from "@/components/ui/use-toast";

export function TenantNotificationSettings() {
  const { 
    notifications, 
    isLoading,
    updateNotificationSettings,
    updateEmailTemplate
  } = useTenantNotifications();
  
  // Email settings state
  const [fromEmail, setFromEmail] = useState(notifications?.fromEmail || "");
  const [replyToEmail, setReplyToEmail] = useState(notifications?.replyToEmail || "");
  const [emailFooter, setEmailFooter] = useState(notifications?.emailFooter || "");
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(notifications?.sendWelcomeEmail ?? true);
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState(notifications?.sendInvoiceEmail ?? true);
  const [sendClassReminders, setSendClassReminders] = useState(notifications?.sendClassReminders ?? true);
  const [sendPaymentReminders, setSendPaymentReminders] = useState(notifications?.sendPaymentReminders ?? true);
  
  // Welcome email template state
  const welcomeEmailTemplate = notifications?.emailTemplates?.find(t => t.type === 'welcome') || {
    type: 'welcome',
    subject: 'Welcome to McKaynine Training',
    content: 'Thank you for joining McKaynine Training. We look forward to working with you and your dog.'
  };
  
  const [welcomeSubject, setWelcomeSubject] = useState(welcomeEmailTemplate.subject);
  const [welcomeContent, setWelcomeContent] = useState(welcomeEmailTemplate.content);
  
  // Invoice email template state
  const invoiceEmailTemplate = notifications?.emailTemplates?.find(t => t.type === 'invoice') || {
    type: 'invoice',
    subject: 'Your McKaynine Training Invoice',
    content: 'Please find attached your invoice for McKaynine Training services.'
  };
  
  const [invoiceSubject, setInvoiceSubject] = useState(invoiceEmailTemplate.subject);
  const [invoiceContent, setInvoiceContent] = useState(invoiceEmailTemplate.content);
  
  const handleSaveEmailSettings = async () => {
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
        title: "Email settings saved",
        description: "Your notification settings have been updated."
      });
    } catch (error) {
      console.error("Error saving email settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was an error saving your notification settings.",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveWelcomeTemplate = async () => {
    try {
      // Create a tuple with the template type and data
      const templateUpdate: [string, { subject: string; content: string }] = [
        'welcome',
        { subject: welcomeSubject, content: welcomeContent }
      ];
      
      await updateEmailTemplate(templateUpdate);
      
      toast({
        title: "Welcome email template saved",
        description: "Your welcome email template has been updated."
      });
    } catch (error) {
      console.error("Error saving welcome email template:", error);
      toast({
        title: "Error saving template",
        description: "There was an error saving your welcome email template.",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveInvoiceTemplate = async () => {
    try {
      // Create a tuple with the template type and data
      const templateUpdate: [string, { subject: string; content: string }] = [
        'invoice',
        { subject: invoiceSubject, content: invoiceContent }
      ];
      
      await updateEmailTemplate(templateUpdate);
      
      toast({
        title: "Invoice email template saved",
        description: "Your invoice email template has been updated."
      });
    } catch (error) {
      console.error("Error saving invoice email template:", error);
      toast({
        title: "Error saving template",
        description: "There was an error saving your invoice email template.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure email notifications and message templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="welcome-email">Welcome Email</TabsTrigger>
              <TabsTrigger value="invoice-email">Invoice Email</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email Address</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="noreply@example.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address that will appear in the From field of all emails
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reply-to-email">Reply-To Email Address</Label>
                  <Input
                    id="reply-to-email"
                    type="email"
                    placeholder="support@example.com"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address recipients will reply to
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-footer">Email Footer Text</Label>
                  <Textarea
                    id="email-footer"
                    placeholder="Footer text to include in all emails"
                    value={emailFooter}
                    onChange={(e) => setEmailFooter(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-4 mt-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="welcome-email"
                      checked={sendWelcomeEmail}
                      onCheckedChange={(checked) => setSendWelcomeEmail(checked)}
                    />
                    <Label htmlFor="welcome-email">Send welcome email to new handlers</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="invoice-email"
                      checked={sendInvoiceEmail}
                      onCheckedChange={(checked) => setSendInvoiceEmail(checked)}
                    />
                    <Label htmlFor="invoice-email">Send invoice notification emails</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="class-reminders"
                      checked={sendClassReminders}
                      onCheckedChange={(checked) => setSendClassReminders(checked)}
                    />
                    <Label htmlFor="class-reminders">Send class reminders</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="payment-reminders"
                      checked={sendPaymentReminders}
                      onCheckedChange={(checked) => setSendPaymentReminders(checked)}
                    />
                    <Label htmlFor="payment-reminders">Send payment reminder emails</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveEmailSettings} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Email Settings"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="welcome-email" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-subject">Email Subject</Label>
                  <Input
                    id="welcome-subject"
                    placeholder="Welcome to McKaynine Training"
                    value={welcomeSubject}
                    onChange={(e) => setWelcomeSubject(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="welcome-content">Email Content</Label>
                  <Textarea
                    id="welcome-content"
                    placeholder="Email body content"
                    value={welcomeContent}
                    onChange={(e) => setWelcomeContent(e.target.value)}
                    rows={10}
                  />
                  <p className="text-sm text-muted-foreground">
                    You can use variables like {'{name}'}, {'{company}'}, etc.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveWelcomeTemplate} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Welcome Template"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="invoice-email" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-subject">Email Subject</Label>
                  <Input
                    id="invoice-subject"
                    placeholder="Your McKaynine Training Invoice"
                    value={invoiceSubject}
                    onChange={(e) => setInvoiceSubject(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invoice-content">Email Content</Label>
                  <Textarea
                    id="invoice-content"
                    placeholder="Email body content"
                    value={invoiceContent}
                    onChange={(e) => setInvoiceContent(e.target.value)}
                    rows={10}
                  />
                  <p className="text-sm text-muted-foreground">
                    You can use variables like {'{name}'}, {'{invoice_number}'}, {'{amount}'}, etc.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveInvoiceTemplate} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Invoice Template"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
