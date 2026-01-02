import { UseFormReturn } from "react-hook-form";
import { FullEnrollmentFormValues } from "../types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Target, Trophy, Heart, AlertCircle, Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Target className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Training Goals & Health</h2>
        <p className="text-muted-foreground">Let us know your goals and any health considerations</p>
      </div>

      <div className="space-y-8 max-w-xl mx-auto">
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
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-3xl block mb-2">{goal.icon}</span>
                <span className="font-semibold block">{goal.label}</span>
                <span className="text-sm text-muted-foreground">{goal.description}</span>
              </button>
            ))}
          </div>
          {errors.trainingGoal && (
            <p className="text-destructive text-sm">{errors.trainingGoal.message}</p>
          )}
        </div>

        {/* Behavior Problems */}
        <div className="bg-muted/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <Label className="text-base font-semibold">Any Behavior Problems?</Label>
                <p className="text-sm text-muted-foreground">Existing issues we should know about</p>
              </div>
            </div>
            <Switch
              checked={hasBehaviorProblems}
              onCheckedChange={(checked) => setValue("hasBehaviorProblems", checked)}
            />
          </div>
          
          {hasBehaviorProblems && (
            <Textarea
              placeholder="Please describe the behavior problems..."
              {...register("behaviorProblemsDetails")}
              className="min-h-[100px] animate-in slide-in-from-top-2 duration-300"
            />
          )}
        </div>

        {/* Health Problems */}
        <div className="bg-muted/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <Label className="text-base font-semibold">Any Health Problems?</Label>
                <p className="text-sm text-muted-foreground">Medical conditions or disabilities</p>
              </div>
            </div>
            <Switch
              checked={hasHealthProblems}
              onCheckedChange={(checked) => setValue("hasHealthProblems", checked)}
            />
          </div>
          
          {hasHealthProblems && (
            <Textarea
              placeholder="Please describe the health problems or disabilities..."
              {...register("healthProblemsDetails")}
              className="min-h-[100px] animate-in slide-in-from-top-2 duration-300"
            />
          )}
        </div>

        {/* Vet Clearance Upload */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">Vet Clearance Document *</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Please upload a copy of your veterinary clearance form (PDF or image)
          </p>
          
          {uploadedFileName ? (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">{uploadedFileName}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Uploaded successfully</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveFile}
                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-green-600" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">
                {isDragActive ? "Drop your file here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, JPEG, or PNG (max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
