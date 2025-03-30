
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DogCardHeader } from "./dog-card/DogCardHeader";
import { BasicInfoTab } from "./dog-card/BasicInfoTab";
import { NotesTab } from "./dog-card/NotesTab";

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
      <DogCardHeader dog={dog} clientId={clientId} onDogUpdated={onDogUpdated} />
      <div className="p-4">
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="p-2">
            <BasicInfoTab age={dog.age} weight={dog.weight} notes={dog.notes} />
          </TabsContent>
          <TabsContent value="behavior" className="p-2">
            <NotesTab 
              notes={dog.behavior_notes} 
              emptyMessage="No behavior notes recorded" 
            />
          </TabsContent>
          <TabsContent value="medical" className="p-2">
            <NotesTab 
              notes={dog.medical_notes} 
              emptyMessage="No medical notes recorded" 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
