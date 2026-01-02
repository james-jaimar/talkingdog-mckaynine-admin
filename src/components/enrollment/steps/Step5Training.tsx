import { UseFormReturn } from "react-hook-form";
import { FullEnrollmentFormValues } from "../types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Target, AlertCircle, Upload, FileText, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Step5TrainingProps {
  form: UseFormReturn<FullEnrollmentFormValues>;
  onFileUpload: (file: File) => void;
  uploadedFileName?: string;
  onRemoveFile: () => void;
}

const trainingGoals = [
  { 
    value: "Competitive dog sport" as const, 
    label: "Competitive Dog Sport",
    description: "Agility, obedience trials, and more",
    icon: "🏆"
  },
  { 
    value: "Chilled canine companion" as const, 
    label: "Chilled Companion",
    description: "A well-behaved family friend",
    icon: "🛋️"
  },
];

export function Step5Training({ form, onFileUpload, uploadedFileName, onRemoveFile }: Step5TrainingProps) {
  const { watch, setValue, register, formState: { errors } } = form;
  const trainingGoal = watch("trainingGoal");
  const hasBehaviorProblems = watch("hasBehaviorProblems");
  const hasHealthProblems = watch("hasHealthProblems");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent/10 mb-2">
          <Target className="h-8 w-8 text-customer-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Training Goals & Health</h2>
        <p className="text-gray-500">Let us know your goals and any health considerations</p>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Training Goal */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">What's Your Training Goal? *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trainingGoals.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => setValue("trainingGoal", goal.value)}
                className={cn(
                  "p-5 rounded-xl border-2 transition-all duration-200 text-left",
                  trainingGoal === goal.value
                    ? "border-customer-accent bg-customer-accent/5 ring-2 ring-customer-accent/20"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                <span className="text-3xl block mb-2">{goal.icon}</span>
                <span className="font-semibold block">{goal.label}</span>
                <span className="text-sm text-gray-500">{goal.description}</span>
              </button>
            ))}
          </div>
          {errors.trainingGoal && (
            <p className="text-destructive text-sm">{errors.trainingGoal.message}</p>
          )}
        </div>

        {/* Behavior and Health Problems - side by side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Behavior Problems */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <Label className="text-base font-semibold">Any Behavior Problems?</Label>
                <p className="text-sm text-gray-500">Existing issues we should know about</p>
              </div>
            </div>
            <Switch
              checked={hasBehaviorProblems}
              onCheckedChange={(checked) => setValue("hasBehaviorProblems", checked)}
              className="data-[state=checked]:bg-customer-accent"
            />
          </div>
          
          {hasBehaviorProblems && (
            <Textarea
              placeholder="Please describe the behavior problems..."
              {...register("behaviorProblemsDetails")}
              className="min-h-[100px] animate-in slide-in-from-top-2 duration-300 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
            />
          )}
          </div>

          {/* Health Problems */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-rose-500" />
              <div>
                <Label className="text-base font-semibold">Any Health Problems?</Label>
                <p className="text-sm text-gray-500">Medical conditions or disabilities</p>
              </div>
            </div>
            <Switch
              checked={hasHealthProblems}
              onCheckedChange={(checked) => setValue("hasHealthProblems", checked)}
              className="data-[state=checked]:bg-customer-accent"
            />
          </div>
          
          {hasHealthProblems && (
            <Textarea
              placeholder="Please describe the health problems or disabilities..."
              {...register("healthProblemsDetails")}
              className="min-h-[100px] animate-in slide-in-from-top-2 duration-300 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
            />
          )}
          </div>
        </div>

        {/* Vet Clearance Upload */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-customer-accent" />
            <Label className="text-base font-semibold">Vet Clearance Document *</Label>
          </div>
          <p className="text-sm text-gray-500">
            Please upload a copy of your veterinary clearance form (PDF or image)
          </p>
          
          {uploadedFileName ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-800">{uploadedFileName}</p>
                  <p className="text-sm text-emerald-600">Uploaded successfully</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveFile}
                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-emerald-600" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                isDragActive
                  ? "border-customer-accent bg-customer-accent/5"
                  : "border-gray-200 hover:border-customer-accent/50 hover:bg-gray-50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="font-medium text-gray-600">
                {isDragActive ? "Drop your file here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                PDF, JPEG, or PNG (max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
