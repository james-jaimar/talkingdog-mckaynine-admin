import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dog, ChevronRight, Plus } from "lucide-react";
import { ClientWithDogs } from "@/types/customer-dashboard";
import { cn } from "@/lib/utils";

interface DogsSummaryCardProps {
  clientData?: ClientWithDogs | null;
  isLoading: boolean;
}

export function DogsSummaryCard({ clientData, isLoading }: DogsSummaryCardProps) {
  const dogs = clientData?.dogs || [];

  return (
    <Card className="bg-customer-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-customer-accent/10 to-customer-accent/5 px-5 py-4 border-b border-customer-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-customer-accent/20 flex items-center justify-center">
              <Dog className="h-5 w-5 text-customer-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Your Dogs</h3>
              <p className="text-xs text-muted-foreground">
                {dogs.length} {dogs.length === 1 ? 'companion' : 'companions'} registered
              </p>
            </div>
          </div>
          {dogs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-customer-accent hover:text-customer-accent hover:bg-customer-accent/10"
            >
              <Link to="/customer/profile">
                View all
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : dogs.length > 0 ? (
          <div className="space-y-2">
            {dogs.slice(0, 3).map((dog, index) => (
              <Link
                key={dog.id}
                to="/customer/profile"
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                  "hover:bg-customer-accent/5 group cursor-pointer"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-customer-accent/20 to-customer-accent/10 flex items-center justify-center text-customer-accent font-semibold text-lg">
                  {dog.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{dog.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{dog.breed}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
            {dogs.length > 3 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                +{dogs.length - 3} more
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Dog className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No dogs registered yet</p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-customer-accent text-customer-accent hover:bg-customer-accent hover:text-customer-accent-foreground"
            >
              <Link to="/customer/profile">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Dog
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
