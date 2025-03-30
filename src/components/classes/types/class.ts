
export interface Class {
  id: string;
  name: string;
  description: string;
  level: string;
  price: number;
  duration: number;
  capacity: number;
  branch_id: string;
  branches?: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}
