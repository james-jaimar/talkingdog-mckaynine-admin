export interface ScanProcessingJob {
  id: string;
  filename: string;
  file_url: string;
  status: 'queued' | 'processing' | 'needs_review' | 'ready_to_save' | 'saved' | 'error';
  page_count: number | null;
  extracted_data: ExtractedData | null;
  field_confidence: Record<string, 'high' | 'medium' | 'low'> | null;
  notes_for_review: string[] | null;
  matched_client_id: string | null;
  created_dog_ids: string[] | null;
  enrollment_ids: string[] | null;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedOwner {
  first_name: string;
  last_name: string;
  account_holder_name: string;
  email: string;
  phone: string;
  occupation: string;
  vet_name: string;
}

export interface ExtractedDog {
  name: string;
  date_of_birth: string;
  gender: string;
  breed: string;
  spay_neuter_status: string;
  acquired_from: string;
  acquired_from_other: string;
  age_at_acquisition: string;
  other_pets: Array<{ type: string; count: number }>;
  children_at_home: string;
  social_behavior: {
    with_dogs: string;
    with_other_animals: string;
    with_people: string;
    details: string;
  };
  training_goal: string;
  has_behavior_problems: boolean;
  behavior_problems_details: string;
  has_health_problems: boolean;
  health_problems_details: string;
  class_type: string;
  class_type_other: string;
  branch_name: string;
  heard_from: string[];
  whatsapp_permission: string;
  photo_permission: string;
  acknowledgements: {
    training_equipment: boolean;
    treats: boolean;
    waste_disposal: boolean;
    onlead_socializing: boolean;
    equipment_supervision: boolean;
  };
  signature_name: string;
  signature_date: string;
}

export interface ExtractedData {
  owner: ExtractedOwner;
  dogs: ExtractedDog[];
  field_confidence: Record<string, 'high' | 'medium' | 'low'>;
  notes_for_review: string[];
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
