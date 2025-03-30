
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import { FieldMapping } from "./types";

interface ReviewStepProps {
  csvData: any[];
  fieldMappings: FieldMapping;
}

export function ReviewStep({ csvData, fieldMappings }: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Ready to import</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>You're about to import {csvData.length} records from your CSV file.</p>
              <p className="mt-1">This will create new handler and dog records in the database.</p>
              <p className="mt-1 font-medium">If a handler with the same email already exists, their record will be updated and new dogs will be added.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border rounded-md p-4">
        <h4 className="font-medium mb-2">Special Handling</h4>
        <div className="text-sm space-y-2">
          <p>• "Name" column will be split into first and last name automatically</p>
          <p>• DOB will be converted to age in years</p>
          <p>• Class information (PUPPY, EO, etc.) will be combined into notes</p>
          <p>• WhatsApp and Photo Permission preferences will be saved in notes</p>
          <p>• <strong>Duplicate handlers (by email) will be detected</strong> and their dogs will be added or updated</p>
          <p>• <strong>Duplicate dogs (by name for same handler) will be updated</strong> rather than creating duplicates</p>
        </div>
      </div>
      
      <div className="border rounded-md p-4">
        <h4 className="font-medium mb-2">Field Mappings Summary</h4>
        <div className="text-sm">
          <Tabs defaultValue="clients">
            <TabsList className="mb-4">
              <TabsTrigger value="clients">Handler Fields</TabsTrigger>
              <TabsTrigger value="dogs">Dog Fields</TabsTrigger>
              <TabsTrigger value="classes">Class Fields</TabsTrigger>
            </TabsList>
            
            <TabsContent value="clients">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(fieldMappings)
                  .filter(([_, value]) => value.startsWith('clients.'))
                  .map(([csvHeader, dbField]) => (
                    <div key={csvHeader} className="flex justify-between">
                      <span className="font-medium">{csvHeader}</span>
                      <span className="text-gray-500">{dbField.split('.')[1]}</span>
                    </div>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="dogs">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(fieldMappings)
                  .filter(([_, value]) => value.startsWith('dogs.'))
                  .map(([csvHeader, dbField]) => (
                    <div key={csvHeader} className="flex justify-between">
                      <span className="font-medium">{csvHeader}</span>
                      <span className="text-gray-500">{dbField.split('.')[1]}</span>
                    </div>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="classes">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(fieldMappings)
                  .filter(([_, value]) => value.startsWith('classes.'))
                  .map(([csvHeader, dbField]) => (
                    <div key={csvHeader} className="flex justify-between">
                      <span className="font-medium">{csvHeader}</span>
                      <span className="text-gray-500">{dbField.split('.')[1].replace('_class', '').toUpperCase().replace('_', ' ')}</span>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
