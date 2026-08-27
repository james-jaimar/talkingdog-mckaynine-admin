import { supabase } from "@/integrations/supabase/client";
import { FullEnrollmentFormValues } from "../types";

export const ALLOWED_VET_CLEARANCE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_VET_CLEARANCE_BYTES = 10 * 1024 * 1024;

export function assertValidVetClearanceFile(file: File) {
  if (!ALLOWED_VET_CLEARANCE_TYPES.includes(file.type as typeof ALLOWED_VET_CLEARANCE_TYPES[number])) {
    throw new Error("Vet clearance must be a PDF, JPEG, PNG or WebP file");
  }
  if (file.size > MAX_VET_CLEARANCE_BYTES) {
    throw new Error("Vet clearance file must be 10 MB or smaller");
  }
}

export function usePublicEnrollmentSubmission() {
  const uploadVetClearance = async (file: File): Promise<string> => {
    assertValidVetClearanceFile(file);
    const ext = file.name.split(".").pop() || "pdf";
    const path = `public/${crypto.randomUUID()}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("vet-clearance-docs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error("Public upload error:", error);
      throw new Error("Failed to upload vet clearance document");
    }
    return path;
  };

  const submitPublicEnrollment = async (
    data: FullEnrollmentFormValues,
    vetClearanceFile: File
  ) => {
    const vetClearancePath = await uploadVetClearance(vetClearanceFile);

    const { data: result, error } = await supabase.functions.invoke(
      "public-puppy-enrollment",
      { body: { ...data, vetClearancePath } }
    );

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(error.message || "Failed to submit registration");
    }
    if (result?.error) throw new Error(result.error);
    return result;
  };

  return { submitPublicEnrollment };
}
