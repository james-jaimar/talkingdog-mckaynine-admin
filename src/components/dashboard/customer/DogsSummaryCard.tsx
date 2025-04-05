
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dog } from "lucide-react";
import { ClientWithDogs } from "@/types/customer-dashboard";

interface DogsSummaryCardProps {
  clientData?: ClientWithDogs | null;
  isLoading: boolean;
}

export function DogsSummaryCard({ clientData, isLoading }: DogsSummaryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Dog className="h-4 w-4 mr-2 text-mckaynine-600" />
          Your Dogs
        </CardTitle>
        <CardDescription>Manage your dog profiles</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : clientData?.dogs?.length ? (
          <ul className="space-y-2">
            {clientData.dogs.map(dog => (
              <li key={dog.id} className="p-2 border rounded-md">
                <p className="font-medium">{dog.name}</p>
                <p className="text-sm text-gray-600">{dog.breed}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No dogs found</p>
        )}
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/customer/profile">Manage Dogs</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
