
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerProfileForm } from "@/components/customer/CustomerProfileForm";
import { ClientData } from "@/hooks/useCustomerProfileData";
import { Loader2 } from "lucide-react";

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
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
            <span className="ml-2">Loading profile data...</span>
          </div>
        ) : error ? (
          <div className="py-4 text-center text-red-500 border border-red-200 rounded-md bg-red-50 p-4">
            <p className="font-semibold">Error loading profile</p>
            <p className="mt-1">{error instanceof Error ? error.message : "Please try again"}</p>
          </div>
        ) : clientData ? (
          <CustomerProfileForm 
            client={clientData} 
            onSuccess={onSuccess} 
          />
        ) : (
          <div className="py-4 text-center text-amber-600 border border-amber-200 rounded-md bg-amber-50 p-4">
            <p className="font-semibold">No profile data found</p>
            <p className="mt-1">Please contact support if this issue persists.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
