
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface FormOption {
  id: string;
  title: string;
  description: string;
  summary: string;
  path: string;
  icon?: React.ReactNode;
  secondaryAction?: {
    label: string;
    path: string;
    icon: React.ReactNode;
  };
}

interface FormSelectorProps {
  forms: FormOption[];
}

export function FormSelector({ forms }: FormSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map((form) => (
        <Card key={form.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              {form.icon || <FileText className="h-5 w-5 mr-2 text-mckaynine-600" />}
              {form.title}
            </CardTitle>
            <CardDescription>
              {form.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{form.summary}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link to={form.path}>
                View Form
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {form.secondaryAction && (
              <Button variant="outline" asChild>
                <Link to={form.secondaryAction.path}>
                  {form.secondaryAction.icon}
                  {form.secondaryAction.label}
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
