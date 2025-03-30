
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dog } from "lucide-react";
import { DogCard } from "./DogCard";

interface DogsListProps {
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
  }>;
}

export function DogsList({ dogs }: DogsListProps) {
  return (
    <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle>Dogs</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {dogs && dogs.length > 0 ? (
          <div className="space-y-6">
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Dog className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No dogs registered</h3>
            <p className="mt-1 text-sm text-gray-500">
              This handler doesn't have any dogs registered yet.
            </p>
            <Button className="mt-4" variant="outline">
              Add Dog
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
