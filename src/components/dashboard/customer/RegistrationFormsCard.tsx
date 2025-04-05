
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function RegistrationFormsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <FileText className="h-4 w-4 mr-2 text-mckaynine-600" />
          Registration Forms
        </CardTitle>
        <CardDescription>Complete registration for new classes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md text-center">
            <h3 className="font-medium">Puppy Class</h3>
            <p className="text-sm text-gray-500 mb-3">For dogs under 6 months</p>
            <Button variant="mckaynine" size="sm" asChild>
              <Link to="/customer/forms/puppy-class">Register</Link>
            </Button>
          </div>
          <div className="p-4 border rounded-md text-center">
            <h3 className="font-medium">Basic Obedience</h3>
            <p className="text-sm text-gray-500 mb-3">For all ages</p>
            <Button variant="mckaynine" size="sm" asChild>
              <Link to="/customer/forms/basic-obedience">Register</Link>
            </Button>
          </div>
          <div className="p-4 border rounded-md text-center">
            <h3 className="font-medium">Advanced Training</h3>
            <p className="text-sm text-gray-500 mb-3">For trained dogs</p>
            <Button variant="mckaynine" size="sm" asChild>
              <Link to="/customer/forms/advanced">Register</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
