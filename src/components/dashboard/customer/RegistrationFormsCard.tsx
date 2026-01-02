import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowRight, Dog, Trophy, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const formOptions = [
  {
    id: "puppy",
    title: "Puppy Class",
    description: "Perfect start for puppies under 6 months",
    icon: Dog,
    path: "/customer/forms/puppy-class",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-600",
    borderColor: "hover:border-amber-500/30",
  },
  {
    id: "basic",
    title: "Basic Obedience",
    description: "Foundation training for all ages",
    icon: GraduationCap,
    path: "/customer/forms/basic-obedience",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-600",
    borderColor: "hover:border-blue-500/30",
  },
  {
    id: "advanced",
    title: "Advanced Training",
    description: "For experienced & trained dogs",
    icon: Trophy,
    path: "/customer/forms/advanced",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-600",
    borderColor: "hover:border-purple-500/30",
  },
];

export function RegistrationFormsCard() {
  return (
    <Card className="bg-customer-card border-0 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-customer-accent/5 to-transparent px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-customer-accent/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-customer-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Register for Classes</h3>
            <p className="text-xs text-muted-foreground">
              Choose a training program that suits your dog
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {formOptions.map((form) => (
            <Link
              key={form.id}
              to={form.path}
              className={cn(
                "group relative p-5 rounded-xl border border-border/50 bg-background",
                "hover:shadow-md transition-all duration-300",
                form.borderColor
              )}
            >
              {/* Gradient Background */}
              <div className={cn(
                "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                form.gradient
              )} />
              
              {/* Content */}
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                  form.iconBg
                )}>
                  <form.icon className={cn("h-6 w-6", form.iconColor)} />
                </div>
                
                <h4 className="font-semibold text-foreground mb-1">{form.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{form.description}</p>
                
                <div className="flex items-center text-sm font-medium text-customer-accent group-hover:translate-x-1 transition-transform duration-200">
                  Register now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
