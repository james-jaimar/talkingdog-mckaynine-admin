
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dog } from "lucide-react";
import { DogCard } from "./DogCard";
import { EditDogModal } from "./EditDogModal";

interface DogsListProps {
  clientId: string;
  dogs: Array<{
    id: string;
    name: string;
    breed: string;
    age?: number;
    weight?: number;
    notes?: string;
    behavior_notes?: string;
    medical_notes?: string;
    avatar_url?: string;
    date_of_birth?: string;
    gender?: string;
    spay_neuter_status?: string;
    acquired_from?: string;
    acquired_from_other?: string;
    age_at_acquisition?: string;
    other_pets?: unknown;
    children_at_home?: string;
    social_behavior?: unknown;
    social_behavior_details?: string;
    training_goal?: string;
    has_behavior_problems?: boolean;
    behavior_problems_details?: string;
    has_health_problems?: boolean;
    health_problems_details?: string;
  }>;
  onDogsUpdated?: () => void;
}

export function DogsList({ dogs, clientId, onDogsUpdated }: DogsListProps) {
  return (
    <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle>Dogs</CardTitle>
        <EditDogModal clientId={clientId} onSuccess={onDogsUpdated} isNew={true} />
      </CardHeader>
      <CardContent className="p-6">
        {dogs && dogs.length > 0 ? (
          <div className="space-y-6">
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} clientId={clientId} onDogUpdated={onDogsUpdated} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Dog className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No dogs registered</h3>
            <p className="mt-1 text-sm text-gray-500">
              This handler doesn't have any dogs registered yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
