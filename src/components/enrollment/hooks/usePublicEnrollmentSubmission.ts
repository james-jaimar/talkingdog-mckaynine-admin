import { supabase } from "@/integrations/supabase/client";
import { FullEnrollmentFormValues } from "../types";

export function usePublicEnrollmentSubmission() {
  const uploadVetClearance = async (file: File): Promise<string> => {
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
