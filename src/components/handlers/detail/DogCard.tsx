
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DogCardHeader } from "./dog-card/DogCardHeader";
import { BasicInfoTab } from "./dog-card/BasicInfoTab";
import { NotesTab } from "./dog-card/NotesTab";
import { HealthBehaviorTab } from "./dog-card/HealthBehaviorTab";

interface DogProps {
  dog: {
    id: string;
    name: string;
    breed: string;
    age?: number;
    weight?: number;
    date_of_birth?: string | null;
    notes?: string;
    behavior_notes?: string;
    medical_notes?: string;
    avatar_url?: string;
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
  };
  clientId: string;
  onDogUpdated?: () => void;
}

export function DogCard({ dog, clientId, onDogUpdated }: DogProps) {
  console.log("DogCard received dog:", dog);
  
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
            <BasicInfoTab 
              age={dog.age} 
              weight={dog.weight} 
              notes={dog.notes}
              date_of_birth={dog.date_of_birth}
              gender={dog.gender}
              spay_neuter_status={dog.spay_neuter_status}
              acquired_from={dog.acquired_from}
              acquired_from_other={dog.acquired_from_other}
              age_at_acquisition={dog.age_at_acquisition}
              training_goal={dog.training_goal}
              children_at_home={dog.children_at_home}
              other_pets={dog.other_pets}
              social_behavior={dog.social_behavior}
              social_behavior_details={dog.social_behavior_details}
            />
          </TabsContent>
          <TabsContent value="behavior" className="p-2">
            <HealthBehaviorTab 
              notes={dog.behavior_notes}
              hasProblems={dog.has_behavior_problems}
              problemsDetails={dog.behavior_problems_details}
              emptyMessage="No behavior notes recorded"
              type="behavior"
            />
          </TabsContent>
          <TabsContent value="medical" className="p-2">
            <HealthBehaviorTab 
              notes={dog.medical_notes}
              hasProblems={dog.has_health_problems}
              problemsDetails={dog.health_problems_details}
              emptyMessage="No medical notes recorded"
              type="medical"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
