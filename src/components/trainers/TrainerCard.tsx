
import { Trainer } from "./types/trainer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TrainerCardProps {
  trainer: Trainer;
  onClick?: () => void;
}

export function TrainerCard({ trainer, onClick }: TrainerCardProps) {
  const fullName = `${trainer.first_name} ${trainer.last_name}`.trim();
  const displayName = trainer.display_name || fullName;
  
  // Create avatar fallback from initials
  const getInitials = () => {
    if (trainer.first_name && trainer.last_name) {
      return `${trainer.first_name[0]}${trainer.last_name[0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };
  
  const hasSpecialties = trainer.specialties && trainer.specialties.length > 0;
  
  return (
    <Card 
      className={`overflow-hidden transition-all ${onClick ? 'hover:shadow-md cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={trainer.avatar_url || undefined} alt={displayName} />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{displayName}</h3>
          <p className="text-sm text-muted-foreground">{trainer.email}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {trainer.branch_names && trainer.branch_names.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {trainer.branch_names.map((branch, index) => (
              <Badge key={index} variant="outline" className="bg-gray-50">
                {branch}
              </Badge>
            ))}
          </div>
        )}
        
        {hasSpecialties && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Specialties</p>
            <div className="flex flex-wrap gap-1">
              {trainer.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
