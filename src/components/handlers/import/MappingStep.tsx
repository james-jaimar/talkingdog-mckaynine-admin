
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FieldMappingPanel } from "./FieldMappingPanel";
import { availableFields } from "./fieldDefinitions";
import { FieldMapping } from "./types";

interface MappingStepProps {
  csvHeaders: string[];
  fieldMappings: FieldMapping;
  onFieldMappingChange: (csvHeader: string, dbField: string) => void;
  validationErrors: string[];
}

export function MappingStep({ 
  csvHeaders, 
  fieldMappings, 
  onFieldMappingChange, 
  validationErrors 
}: MappingStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        Map your CSV headers to database fields. Required fields are marked with *.
      </p>
      
      <Tabs defaultValue="clients">
        <TabsList className="mb-4">
          <TabsTrigger value="clients">Handler Data</TabsTrigger>
          <TabsTrigger value="dogs">Dog Data</TabsTrigger>
          <TabsTrigger value="classes">Class Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients" className="space-y-4">
          <FieldMappingPanel
            fields={availableFields.filter(f => f.table === "clients")}
            csvHeaders={csvHeaders}
            fieldMappings={fieldMappings}
            onMappingChange={onFieldMappingChange}
          />
        </TabsContent>
        
        <TabsContent value="dogs" className="space-y-4">
          <FieldMappingPanel
            fields={availableFields.filter(f => f.table === "dogs")}
            csvHeaders={csvHeaders}
            fieldMappings={fieldMappings}
            onMappingChange={onFieldMappingChange}
          />
        </TabsContent>
        
        <TabsContent value="classes" className="space-y-4">
          <FieldMappingPanel
            fields={availableFields.filter(f => f.table === "classes")}
            csvHeaders={csvHeaders}
            fieldMappings={fieldMappings}
            onMappingChange={onFieldMappingChange}
          />
        </TabsContent>
      </Tabs>
      
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-5">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
