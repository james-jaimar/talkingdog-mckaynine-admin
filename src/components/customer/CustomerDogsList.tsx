
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Dog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CustomerEditDogModal } from "./CustomerEditDogModal";

interface Dog {
  id: string;
  name: string;
  breed: string;
  age?: number;
  weight?: number;
  date_of_birth?: string;
  notes?: string;
  behavior_notes?: string;
  medical_notes?: string;
  avatar_url?: string;
}

interface CustomerDogsListProps {
  clientId?: string;
  dogs: Dog[];
  isLoading: boolean;
  onDogsUpdated: () => void;
}

export function CustomerDogsList({ clientId, dogs, isLoading, onDogsUpdated }: CustomerDogsListProps) {
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const handleEditDog = (dog: Dog) => {
    setSelectedDog(dog);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onDogsUpdated();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Dogs</CardTitle>
          <CardDescription>View and manage your dogs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center">Loading dogs...</div>
          ) : dogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dogs.map((dog) => (
                <div key={dog.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-4 flex items-center justify-center">
                    {dog.avatar_url ? (
                      <img
                        src={dog.avatar_url}
                        alt={dog.name}
                        className="h-24 w-24 object-cover rounded-full border-2 border-mckaynine-500"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-mckaynine-100 flex items-center justify-center">
                        <Dog className="h-12 w-12 text-mckaynine-500" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{dog.name}</h3>
                    <p className="text-gray-600">{dog.breed}</p>
                    {dog.age && <p className="text-sm">Age: {dog.age} years</p>}
                    {dog.weight && <p className="text-sm">Weight: {dog.weight} kg</p>}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleEditDog(dog)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Dog className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No dogs found.</p>
              {clientId && (
                <p className="text-sm text-gray-500 mt-2">
                  Dogs are added by our administrators during class registration.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedDog && (
        <CustomerEditDogModal
          dog={selectedDog}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
