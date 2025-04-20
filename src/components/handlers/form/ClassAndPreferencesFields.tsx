
import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";
import { FormCheckboxField } from "./FormCheckboxField";
import { FormTextAreaField } from "./FormTextAreaField";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form";

interface ClassAndPreferencesFieldsProps {
  control: Control<any>;
}

// Interface for class data
interface ClassData {
  id: string;
  name: string;
  class_type: string;
  description: string;
}

// Function to get classes by type
const useClassesByType = () => {
  return useQuery({
    queryKey: ['classes-by-type'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, class_type, description')
        .order('name');
      
      if (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }

      // Group classes by their type
      const classesByType = (data || []).reduce((acc: Record<string, ClassData[]>, item: ClassData) => {
        const type = item.class_type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(item);
        return acc;
      }, {});

      return classesByType;
    },
  });
};

// Mapping of class types to potential class_type values
const classTypeMap = {
  puppyClass: ["Puppy"],
  eoClass: ["EO"],
  bronzeCgcClass: ["CGC Bronze"],
  silverCgcClass: ["CGC Silver"],
  beginnerNoviceClass: ["Beginner", "Novice"],
  wtClass: ["WT"],
  aTestClass: ["A-Test"],
  yogaClass: ["Yoga"],
};

// Component for a class dropdown field
const ClassDropdownField = ({ 
  name, 
  label, 
  control, 
  classes = [] 
}: { 
  name: string; 
  label: string; 
  control: Control<any>; 
  classes: ClassData[] 
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          <Select
            value={field.value || ""}
            onValueChange={field.onChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {classes.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
};

export function ClassAndPreferencesFields({ control }: ClassAndPreferencesFieldsProps) {
  const { data: classesByType, isLoading, error } = useClassesByType();

  // Helper function to get classes for a specific class type
  const getClassesForType = (classType: string): ClassData[] => {
    if (!classesByType || isLoading) return [];
    
    const types = classTypeMap[classType as keyof typeof classTypeMap] || [];
    
    // Collect all classes that match any of the relevant types
    return types.flatMap(type => classesByType[type] || []);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Class Enrollment</h4>
        
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading class options...</div>
        ) : error ? (
          <div className="text-sm text-red-500">Error loading classes. Please try again later.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ClassDropdownField 
                name="puppyClass"
                label="Puppy Class"
                control={control}
                classes={getClassesForType("puppyClass")}
              />
              
              <ClassDropdownField
                name="eoClass"
                label="EO Class"
                control={control}
                classes={getClassesForType("eoClass")}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <ClassDropdownField
                name="bronzeCgcClass"
                label="Bronze CGC Class"
                control={control}
                classes={getClassesForType("bronzeCgcClass")}
              />
              
              <ClassDropdownField
                name="silverCgcClass"
                label="Silver CGC Class"
                control={control}
                classes={getClassesForType("silverCgcClass")}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <ClassDropdownField
                name="beginnerNoviceClass"
                label="Beginner/Novice Class"
                control={control}
                classes={getClassesForType("beginnerNoviceClass")}
              />
              
              <ClassDropdownField
                name="wtClass"
                label="Working Trials Class"
                control={control}
                classes={getClassesForType("wtClass")}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <ClassDropdownField
                name="aTestClass"
                label="A-Test Class"
                control={control}
                classes={getClassesForType("aTestClass")}
              />
              
              <ClassDropdownField
                name="yogaClass"
                label="Yoga Class"
                control={control}
                classes={getClassesForType("yogaClass")}
              />
            </div>
          </>
        )}
        
        <div className="mt-6">
          <FormTextField
            control={control}
            name="classEnrollment"
            label="Additional Class Notes"
            placeholder="Any additional class enrollment details"
          />
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Communication Preferences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormCheckboxField
            control={control}
            name="whatsApp"
            label="I consent to WhatsApp communication"
          />
          
          <FormCheckboxField
            control={control}
            name="photoPermission"
            label="I consent to photos being taken of my dog for marketing purposes"
          />
        </div>
      </div>
      
      <Separator />
      
      <FormTextAreaField
        control={control}
        name="comments"
        label="Additional Comments or Special Requests"
        placeholder="Any additional notes or special requests..."
      />
    </div>
  );
}
