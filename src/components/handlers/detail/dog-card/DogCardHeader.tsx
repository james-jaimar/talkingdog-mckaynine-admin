
import { EditDogModal } from "../EditDogModal";
import { DogAvatar } from "./DogAvatar";

interface DogCardHeaderProps {
  dog: {
    id: string;
    name: string;
    breed: string;
    avatar_url?: string;
  };
  clientId: string;
  onDogUpdated?: () => void;
}

export function DogCardHeader({ dog, clientId, onDogUpdated }: DogCardHeaderProps) {
  return (
    <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <DogAvatar avatarUrl={dog.avatar_url} name={dog.name} />
        <div>
          <h3 className="font-semibold">{dog.name}</h3>
          <p className="text-sm text-gray-500">{dog.breed}</p>
        </div>
      </div>
      <EditDogModal dog={dog} clientId={clientId} onSuccess={onDogUpdated} />
    </div>
  );
}
