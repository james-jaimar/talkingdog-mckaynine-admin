
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BasicInfoTabProps {
  age?: number;
  weight?: number;
  notes?: string;
  date_of_birth?: string | null;
  gender?: string;
  spay_neuter_status?: string;
  acquired_from?: string;
  acquired_from_other?: string;
  age_at_acquisition?: string;
  training_goal?: string;
  children_at_home?: string;
  other_pets?: unknown;
  social_behavior?: unknown;
  social_behavior_details?: string;
}

function formatOtherPets(otherPets?: unknown) {
  if (!otherPets || typeof otherPets !== 'object') return null;
  const petsObj = otherPets as Record<string, boolean>;
  const pets = Object.entries(petsObj)
    .filter(([key, value]) => value === true && key !== 'none')
    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
  return pets.length > 0 ? pets.join(', ') : 'None';
}

function formatSocialBehavior(socialBehavior?: unknown) {
  if (!socialBehavior || typeof socialBehavior !== 'object') return null;
  const behaviorObj = socialBehavior as Record<string, string>;
  const behaviors = Object.entries(behaviorObj)
    .filter(([_, value]) => value && value !== '')
    .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
  return behaviors.length > 0 ? behaviors : null;
}

export function BasicInfoTab({ 
  age, 
  weight, 
  notes, 
  date_of_birth,
  gender,
  spay_neuter_status,
  acquired_from,
  acquired_from_other,
  age_at_acquisition,
  training_goal,
  children_at_home,
  other_pets,
  social_behavior,
  social_behavior_details
}: BasicInfoTabProps) {
  console.log("BasicInfoTab received date_of_birth:", date_of_birth);
  
  const hasBasicInfo = date_of_birth || age !== undefined || weight !== undefined || gender || spay_neuter_status;
  const hasAcquisitionInfo = acquired_from || age_at_acquisition;
  const hasHomeInfo = children_at_home || other_pets || social_behavior || training_goal;
  
  return (
    <div className="space-y-6">
      {/* Basic Details */}
      {hasBasicInfo && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Details</h4>
          <div className="grid grid-cols-2 gap-4">
            {gender && (
              <div>
                <span className="text-sm text-muted-foreground">Gender:</span>
                <span className="text-sm ml-2">{gender}</span>
              </div>
            )}
            {date_of_birth && (
              <div>
                <span className="text-sm text-muted-foreground">DOB:</span>
                <span className="text-sm ml-2">{formatDate(date_of_birth)}</span>
              </div>
            )}
            {age !== undefined && (
              <div>
                <span className="text-sm text-muted-foreground">Age:</span>
                <span className="text-sm ml-2">{age} years</span>
              </div>
            )}
            {weight !== undefined && (
              <div>
                <span className="text-sm text-muted-foreground">Weight:</span>
                <span className="text-sm ml-2">{weight} kg</span>
              </div>
            )}
            {spay_neuter_status && (
              <div className="col-span-2">
                <span className="text-sm text-muted-foreground">Spay/Neuter:</span>
                <span className="text-sm ml-2">{spay_neuter_status}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acquisition Info */}
      {hasAcquisitionInfo && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Acquisition</h4>
          <div className="grid grid-cols-2 gap-4">
            {acquired_from && (
              <div>
                <span className="text-sm text-muted-foreground">From:</span>
                <span className="text-sm ml-2">
                  {acquired_from}{acquired_from_other && ` (${acquired_from_other})`}
                </span>
              </div>
            )}
            {age_at_acquisition && (
              <div>
                <span className="text-sm text-muted-foreground">Age at acquisition:</span>
                <span className="text-sm ml-2">{age_at_acquisition}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Home & Training Info */}
      {hasHomeInfo && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Home & Training</h4>
          <div className="space-y-2">
            {training_goal && (
              <div>
                <span className="text-sm text-muted-foreground">Training Goal:</span>
                <Badge variant="secondary" className="ml-2">{training_goal}</Badge>
              </div>
            )}
            {children_at_home && (
              <div>
                <span className="text-sm text-muted-foreground">Children at home:</span>
                <span className="text-sm ml-2">{children_at_home}</span>
              </div>
            )}
            {formatOtherPets(other_pets) && (
              <div>
                <span className="text-sm text-muted-foreground">Other pets:</span>
                <span className="text-sm ml-2">{formatOtherPets(other_pets)}</span>
              </div>
            )}
            {formatSocialBehavior(social_behavior) && (
              <div>
                <span className="text-sm text-muted-foreground">Social behavior:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {formatSocialBehavior(social_behavior)?.map((b, i) => (
                    <Badge key={i} variant="outline">{b}</Badge>
                  ))}
                </div>
              </div>
            )}
            {social_behavior_details && (
              <div>
                <span className="text-sm text-muted-foreground">Social notes:</span>
                <p className="text-sm mt-1">{social_behavior_details}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {notes && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Notes</h4>
          <p className="text-sm whitespace-pre-wrap">{notes}</p>
        </div>
      )}
      
      {!hasBasicInfo && !hasAcquisitionInfo && !hasHomeInfo && !notes && (
        <p className="text-muted-foreground italic">No basic information recorded</p>
      )}
    </div>
  );
}
