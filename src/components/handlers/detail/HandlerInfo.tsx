
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface HandlerInfoProps {
  handler: {
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    created_at: string;
    notes?: string;
  };
}

export function HandlerInfo({ handler }: HandlerInfoProps) {
  return (
    <Card className="lg:col-span-1 border border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle>Handler Information</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-900">{handler.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Phone</p>
            <p className="text-gray-900">{handler.phone || "Not provided"}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-gray-900">{handler.address || "Not provided"}</p>
            {(handler.city || handler.postal_code) && (
              <p className="text-gray-900">
                {handler.city}{handler.city && handler.postal_code && ", "}{handler.postal_code}
              </p>
            )}
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-gray-500">Member Since</p>
            <p className="text-gray-900">{new Date(handler.created_at).toLocaleDateString()}</p>
          </div>
          {handler.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="text-gray-900 whitespace-pre-line">{handler.notes}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
