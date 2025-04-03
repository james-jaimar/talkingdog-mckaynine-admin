
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerProfileForm } from "@/components/customer/CustomerProfileForm";
import { ClientData } from "@/hooks/useCustomerProfileData";

interface CustomerProfileTabProps {
  clientData: ClientData | null;
  isLoading: boolean;
  error: Error | null;
  onSuccess: () => void;
}

export function CustomerProfileTab({ 
  clientData, 
  isLoading, 
  error, 
  onSuccess 
}: CustomerProfileTabProps) {
  return (
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
            onSuccess={onSuccess} 
          />
        ) : (
          <div className="py-4 text-center text-amber-600">
            No profile data found. Please contact support if this issue persists.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
