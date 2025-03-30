
import { Dog } from "lucide-react";

interface DogAvatarProps {
  avatarUrl?: string;
  name: string;
}

export function DogAvatar({ avatarUrl, name }: DogAvatarProps) {
  return avatarUrl ? (
    <img 
      src={avatarUrl} 
      alt={name} 
      className="h-10 w-10 rounded-full object-cover"
    />
  ) : (
    <div className="h-10 w-10 bg-mckaynine-100 text-mckaynine-600 rounded-full flex items-center justify-center">
      <Dog className="h-6 w-6" />
    </div>
  );
}
