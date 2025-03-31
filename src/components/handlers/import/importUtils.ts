
import { SupabaseClient } from "@supabase/supabase-js";

interface ImportRow {
  "E-mail": string;
  "Dog's Name": string;
  "Breed": string;
  "DOB"?: string;
  "Assess"?: string;
  "Tel"?: string;
  "PUPPY"?: string;
  "EO"?: string;
  "BRONZE CGC"?: string;
  "SILVER CGC"?: string;
  "BEGINNER/Novice"?: string;
  "WT"?: string;
  "YOGA"?: string;
  "COMMENTS"?: string;
  "WhatsApp"?: string;
  "Photo Pemission"?: string;
  [key: string]: any;
}

export async function processImportData(
  data: any[],
  createMissingHandlers: boolean,
  supabase: SupabaseClient
): Promise<number> {
  let importedCount = 0;

  for (const row of data) {
    const parsedRow = parseRow(row);
    
    if (!parsedRow["E-mail"] || !parsedRow["Dog's Name"] || !parsedRow["Breed"]) {
      console.warn("Skipping row with missing required fields:", parsedRow);
      continue;
    }

    try {
      // 1. Check if handler exists
      const email = parsedRow["E-mail"].trim();
      let { data: existingClients } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
        .eq("email", email);

      let clientId;

      // 2. Create new handler if needed
      if (!existingClients || existingClients.length === 0) {
        if (!createMissingHandlers) {
          console.warn(`Skipping row for email ${email} - handler doesn't exist`);
          continue;
        }

        // Extract first and last name from email or use placeholders
        const nameParts = extractNameFromEmail(email);
        
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert({
            email: email,
            first_name: nameParts.firstName,
            last_name: nameParts.lastName,
            phone: parsedRow["Tel"] || parsedRow["WhatsApp"] || null,
            notes: parsedRow["COMMENTS"] || null
          })
          .select("id")
          .single();

        if (error) throw error;
        clientId = newClient.id;
      } else {
        clientId = existingClients[0].id;
      }

      // 3. Add the dog
      const dogName = parsedRow["Dog's Name"].trim();
      const { data: newDog, error: dogError } = await supabase
        .from("dogs")
        .insert({
          client_id: clientId,
          name: dogName,
          breed: parsedRow["Breed"].trim(),
          notes: parsedRow["COMMENTS"] || null,
          age: calculateAgeFromDOB(parsedRow["DOB"])
        })
        .select("id")
        .single();

      if (dogError) throw dogError;

      // 4. Add class enrollments if any
      const enrollmentData = {
        dog_id: newDog.id,
        puppy_class: hasValue(parsedRow["PUPPY"]),
        eo_class: hasValue(parsedRow["EO"]),
        bronze_cgc_class: hasValue(parsedRow["BRONZE CGC"]),
        silver_cgc_class: hasValue(parsedRow["SILVER CGC"]),
        beginner_novice_class: hasValue(parsedRow["BEGINNER/Novice"]),
        wt_class: hasValue(parsedRow["WT"]),
        yoga_class: hasValue(parsedRow["YOGA"])
      };

      const hasAnyEnrollment = Object.values(enrollmentData).some(
        (val, index) => index > 0 && val === true
      );

      if (hasAnyEnrollment) {
        await supabase.from("class_enrollments").insert(enrollmentData);
      }

      importedCount++;
    } catch (error) {
      console.error("Error processing row:", parsedRow, error);
      // Continue with next row instead of stopping the entire import
    }
  }

  return importedCount;
}

function parseRow(row: any): ImportRow {
  // Handle different CSV formats - some might have spaces in keys, some might not
  const normalizedRow: ImportRow = { ...row };
  
  // Normalize keys if needed (e.g., "E-mail" vs "E-mail ")
  Object.keys(row).forEach(key => {
    const trimmedKey = key.trim();
    if (key !== trimmedKey) {
      normalizedRow[trimmedKey] = row[key];
      delete normalizedRow[key];
    }
  });

  return normalizedRow;
}

function extractNameFromEmail(email: string): { firstName: string; lastName: string } {
  // Basic logic to extract name from email
  const parts = email.split('@')[0].split(/[\.\_]/);
  
  if (parts.length >= 2) {
    // Try to capitalize first letter of each name part
    return {
      firstName: capitalizeFirstLetter(parts[0]),
      lastName: capitalizeFirstLetter(parts[1])
    };
  }
  
  return {
    firstName: capitalizeFirstLetter(parts[0]),
    lastName: "Unknown"
  };
}

function capitalizeFirstLetter(string: string): string {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function calculateAgeFromDOB(dobString?: string): number | null {
  if (!dobString) return null;
  
  try {
    // Parse various date formats
    let dob: Date | null = null;
    
    // Try dd-MMM-yy format (e.g., "01-Sep-24")
    if (dobString.match(/^\d{2}-[A-Za-z]{3}-\d{2}$/)) {
      const parts = dobString.split('-');
      const monthMap: {[key: string]: number} = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, 
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
      };
      
      // Adjust for two-digit year
      let year = parseInt(parts[2]);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      dob = new Date(year, monthMap[parts[1]], parseInt(parts[0]));
    } else {
      // Try to use the Date constructor as fallback
      dob = new Date(dobString);
    }
    
    if (isNaN(dob.getTime())) return null;
    
    // Calculate age in months
    const now = new Date();
    const ageInMonths = (now.getFullYear() - dob.getFullYear()) * 12 + 
                       (now.getMonth() - dob.getMonth());
    
    return ageInMonths > 0 ? Math.floor(ageInMonths / 12) : 0;
  } catch (e) {
    console.warn("Error calculating age from DOB:", dobString, e);
    return null;
  }
}

function hasValue(value?: string): boolean {
  if (!value) return false;
  
  value = value.trim().toLowerCase();
  
  // Check various positive indicators
  if (value === "yes" || value === "y" || value === "true" || value === "1") return true;
  
  // Check if there's any text that might indicate enrollment
  if (value.includes("enrolled") || value.includes("grad") || 
      value.includes("declan") || value.includes("april") ||
      value.includes("jan")) return true;
  
  // If there's any substantial text (not just spaces or dashes)
  if (value.length > 0 && value !== "-" && value !== "no" && value !== "n") return true;
  
  return false;
}
