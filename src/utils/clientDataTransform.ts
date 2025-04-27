
import { Client, Dog } from "@/hooks/useClientsData";
import { HandlerData } from "@/types/handler";

export function transformToClientType(handlerData: HandlerData): Client {
  return {
    ...handlerData,
    phone: handlerData.phone || '', // Ensure phone is not optional
    address: handlerData.address || '', // Ensure address is not optional
    city: handlerData.city || '', // Ensure city is not optional
    postal_code: handlerData.postal_code || '', // Ensure postal_code is not optional
    branch_id: handlerData.branch_id || null, // Ensure branch_id is set correctly
    notes: handlerData.notes || null, // Set notes to null if not provided
    // Transform dogs array to match the Dog type required by Client interface
    dogs: handlerData.dogs ? handlerData.dogs.map(dog => ({
      ...dog,
      client_id: handlerData.id, // Add required client_id
      created_at: dog.created_at || handlerData.created_at, // Use client's created_at as fallback
      updated_at: dog.updated_at || handlerData.updated_at, // Use client's updated_at as fallback
    })) as Dog[] : undefined,
  };
}
