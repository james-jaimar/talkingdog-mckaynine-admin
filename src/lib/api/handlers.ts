
/**
 * API functions for handlers management
 */

/**
 * Delete a handler by ID
 * @param id Handler ID to delete
 * @returns Promise with the deletion result
 */
export const deleteHandler = async (id: string) => {
  try {
    const response = await fetch(`/api/handlers/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete handler');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in deleteHandler:", error);
    throw error;
  }
};
