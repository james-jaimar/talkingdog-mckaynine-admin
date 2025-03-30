
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dog } from "lucide-react";
import { EditDogModal } from "./EditDogModal";

interface DogProps {
  dog: {
    id: string;
    name: string;
    breed: string;
    age?: number;
    weight?: number;
    notes?: string;
    behavior_notes?: string;
    medical_notes?: string;
    avatar_url?: string;
  };
  clientId: string;
  onDogUpdated?: () => void;
}

export function DogCard({ dog, clientId, onDogUpdated }: DogProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {dog.avatar_url ? (
            <img 
              src={dog.avatar_url} 
              alt={dog.name} 
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 bg-mckaynine-100 text-mckaynine-600 rounded-full flex items-center justify-center">
              <Dog className="h-6 w-6" />
            </div>
          )}
          <div>
            <h3 className="font-semibold">{dog.name}</h3>
            <p className="text-sm text-gray-500">{dog.breed}</p>
          </div>
        </div>
        <EditDogModal dog={dog} clientId={clientId} onSuccess={onDogUpdated} />
      </div>
      <div className="p-4">
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="p-2">
            <div className="grid grid-cols-2 gap-4">
              {dog.age && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Age</p>
                  <p>{dog.age} years</p>
                </div>
              )}
              {dog.weight && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Weight</p>
                  <p>{dog.weight} lbs</p>
                </div>
              )}
              {dog.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="whitespace-pre-line">{dog.notes}</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="behavior" className="p-2">
            {dog.behavior_notes ? (
              <div>
                <p className="whitespace-pre-line">{dog.behavior_notes}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No behavior notes recorded</p>
            )}
          </TabsContent>
          <TabsContent value="medical" className="p-2">
            {dog.medical_notes ? (
              <div>
                <p className="whitespace-pre-line">{dog.medical_notes}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No medical notes recorded</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
