
// Extract date of birth from dog's age or notes
export const extractDOB = (dog: any) => {
  if (!dog) return "-";
  
  // Check if we have age in years, convert to approximate DOB
  if (dog.age) {
    const today = new Date();
    const birthYear = today.getFullYear() - dog.age;
    return format(new Date(birthYear, 0, 1), "dd/MM/yyyy");
  }
  
  // Try to find DOB in notes
  if (dog.notes && dog.notes.includes("DOB:")) {
    const regex = /DOB:\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/;
    const match = dog.notes.match(regex);
    if (match) {
      const dateStr = match[1];
      try {
        // Handle different date formats
        let date;
        if (dateStr.includes('/')) {
          // Format: DD/MM/YYYY
          const [day, month, year] = dateStr.split('/').map(Number);
          date = new Date(year, month - 1, day);
        } else {
          // Format: YYYY-MM-DD
          date = new Date(dateStr);
        }
        if (!isNaN(date.getTime())) {
          return format(date, "dd/MM/yyyy");
        }
      } catch (e) {
        // Return original string if parsing fails
        return dateStr;
      }
    }
  }
  
  return "-";
};

// Format phone number to ensure it starts with 0
export const formatPhoneNumber = (phone: string | null) => {
  if (!phone) return "-";
  
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If the number doesn't start with 0, add it
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  // Format with spaces for readability
  return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
};

// Helper function to extract class-specific notes
export const extractClassNotes = (notes: string | null, className: string) => {
  if (!notes) return "";
  
  const regex = new RegExp(`${className}:\\s*(.*?)(?=\\n[A-Z\\s]+:|$)`, "s");
  const match = notes.match(regex);
  return match ? match[1].trim() : "";
};

// Helper function to extract preferences
export const extractPreference = (notes: string | null, preference: string) => {
  if (!notes) return false;
  
  const regex = new RegExp(`${preference}:\\s*(Yes|No|True|False|1|0)`, "i");
  const match = notes.match(regex);
  if (!match) return false;
  
  const value = match[1].toLowerCase();
  return value === 'yes' || value === 'true' || value === '1';
};

import { format } from "date-fns";
