
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
  "Photo Permission"?: string;
  "Name"?: string; // Name column
  [key: string]: any;
}

export async function processImportData(
  data: any[],
  createMissingHandlers: boolean,
  supabase: SupabaseClient,
  branchId?: string
): Promise<number> {
  let importedCount = 0;
  console.log(`Processing ${data.length} rows for import with branchId: ${branchId || 'none'}`);

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
        .select("id, first_name, branch_id")
        .eq("email", email);

      let clientId;

      // 2. Create new handler if needed
      if (!existingClients || existingClients.length === 0) {
        if (!createMissingHandlers) {
          console.warn(`Skipping row for email ${email} - handler doesn't exist`);
          continue;
        }

        // Get handler name from the "Name" column or use email as fallback
        const handlerName = parsedRow["Name"] ? parsedRow["Name"].trim() : email.split('@')[0];
        
        // Generate notes with WhatsApp and Photo Permission preferences
        const notes = generateNotes(parsedRow);
        
        // Insert new client with name in first_name field and empty last_name
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert({
            email: email,
            first_name: handlerName,
            last_name: "", // Empty last name as requested
            phone: parsedRow["Tel"] || null,
            notes: notes,
            branch_id: branchId || null
          })
          .select("id")
          .single();

        if (error) throw error;
        
        // Also add to client_branches junction table
        if (newClient && branchId) {
          await supabase
            .from('client_branches')
            .insert({ client_id: newClient.id, branch_id: branchId })
            .throwOnError();
        }
        
        clientId = newClient.id;
        console.log(`Created new client: ${handlerName} (${email}) with ID: ${clientId}`);
      } else {
        clientId = existingClients[0].id;
        console.log(`Using existing client with ID: ${clientId} for email: ${email}`);
        
        // Update branch_id if the client doesn't have one and we have one to set
        if (branchId && (!existingClients[0].branch_id || existingClients[0].branch_id === null)) {
          await supabase
            .from("clients")
            .update({ branch_id: branchId })
            .eq("id", clientId);
          console.log(`Updated branch_id to ${branchId} for client: ${clientId}`);
        }
        
        // Ensure client is in client_branches junction table
        if (branchId) {
          await supabase
            .from('client_branches')
            .upsert({ client_id: clientId, branch_id: branchId }, { onConflict: 'client_id,branch_id' });
        }
      }

      // 3. Add the dog
      const dogName = parsedRow["Dog's Name"].trim();
      
      // Check if dog already exists for this client
      const { data: existingDogs } = await supabase
        .from("dogs")
        .select("id")
        .eq("client_id", clientId)
        .eq("name", dogName);
        
      let dogId;
      
      if (existingDogs && existingDogs.length > 0) {
        // Use existing dog
        dogId = existingDogs[0].id;
        console.log(`Using existing dog with ID: ${dogId} for client: ${clientId}`);
      } else {
        // Create new dog
        const { data: newDog, error: dogError } = await supabase
          .from("dogs")
          .insert({
            client_id: clientId,
            name: dogName,
            breed: parsedRow["Breed"].trim(),
            behavior_notes: parsedRow["Assess"] || null,
            age: calculateAgeFromDOB(parsedRow["DOB"]),
            // Store original DOB in notes if available
            notes: parsedRow["DOB"] ? `DOB: ${parsedRow["DOB"]}` : (parsedRow["COMMENTS"] || null)
          })
          .select("id")
          .single();

        if (dogError) throw dogError;
        dogId = newDog.id;
        console.log(`Created new dog: ${dogName} with ID: ${dogId} for client: ${clientId}`);
      }

      // 4. Add class enrollments if any - now storing the actual text values
      const enrollmentData = {
        dog_id: dogId,
        puppy_class: parsedRow["PUPPY"] || null,
        eo_class: parsedRow["EO"] || null,
        bronze_cgc_class: parsedRow["BRONZE CGC"] || null,
        silver_cgc_class: parsedRow["SILVER CGC"] || null,
        beginner_novice_class: parsedRow["BEGINNER/Novice"] || null,
        wt_class: parsedRow["WT"] || null,
        yoga_class: parsedRow["YOGA"] || null
      };

      // Log the enrollment data to check what's being saved
      console.log("Enrollment data:", enrollmentData);

      const hasAnyEnrollment = Object.entries(enrollmentData).some(
        ([key, val]) => key !== 'dog_id' && val !== null && val !== ""
      );

      if (hasAnyEnrollment) {
        const { error: enrollmentError } = await supabase.from("class_enrollments").insert(enrollmentData);
        if (enrollmentError) {
          console.error("Error creating enrollment:", enrollmentError);
        } else {
          console.log(`Created class enrollment for dog: ${dogId}`);
        }
      } else {
        console.log("No class enrollments found for this row");
      }

      importedCount++;
    } catch (error) {
      console.error("Error processing row:", parsedRow, error);
      // Continue with next row instead of stopping the entire import
    }
  }

  console.log(`Successfully imported ${importedCount} handlers`);
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

function generateNotes(row: ImportRow): string {
  const notes: string[] = [];
  
  // Add WhatsApp preference
  if (hasValue(row["WhatsApp"])) {
    notes.push("WhatsApp: yes");
  }
  
  // Add Photo Permission preference
  if (hasValue(row["Photo Permission"])) {
    notes.push("Photo Permission: yes");
  }
  
  // Add comments if available
  if (row["COMMENTS"]) {
    notes.push(row["COMMENTS"]);
  }
  
  return notes.join("\n");
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
  
  value = value.trim();
  
  // If there's any text at all, consider it a value
  return value.length > 0 && value !== "-" && value !== "no" && value !== "n";
}
