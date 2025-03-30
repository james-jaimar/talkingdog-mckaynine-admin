
import { ChangeEvent } from "react";
import { FileUp } from "lucide-react";

interface UploadStepProps {
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function UploadStep({ onFileChange }: UploadStepProps) {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <FileUp className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4 flex text-sm leading-6 text-gray-600">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer rounded-md bg-white font-semibold text-mckaynine-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-mckaynine-600 focus-within:ring-offset-2 hover:text-mckaynine-500"
          >
            <span>Upload a file</span>
            <input 
              id="file-upload" 
              name="file-upload" 
              type="file" 
              className="sr-only"
              accept=".csv"
              onChange={onFileChange}
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs leading-5 text-gray-600">CSV files only</p>
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Your CSV file should contain handler and dog information including:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Handler name and email</li>
          <li>Dog's name and breed</li>
          <li>Optional: DOB, assessment notes, class info</li>
        </ul>
      </div>
    </div>
  );
}
