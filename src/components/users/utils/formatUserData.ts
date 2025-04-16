
import { UserProfile } from "../types/userTypes";

/**
 * Format a user's display name consistently
 */
export function formatUserDisplayName(user: UserProfile): string {
  if (user.full_name && user.full_name.trim()) {
    return user.full_name.trim();
  }
  
  if (user.email) {
    // Extract name from email
    return user.email.split('@')[0];
  }
  
  return 'Unnamed User';
}

/**
 * Get a role badge color class based on user role
 */
export function getRoleBadgeClass(role: string): string {
  switch (role?.toLowerCase()) {
    case "admin": 
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "trainer": 
      return "bg-green-100 text-green-800 border-green-300";
    case "handler": 
      return "bg-orange-100 text-orange-800 border-orange-300";
    default: 
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

/**
 * Format and filter users by search term
 */
export function filterUsersBySearch(users: UserProfile[], searchTerm: string): UserProfile[] {
  if (!searchTerm.trim()) {
    return users;
  }
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return users.filter(user => {
    const fullName = (user.full_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    
    return fullName.includes(normalizedSearch) || 
           email.includes(normalizedSearch) || 
           username.includes(normalizedSearch);
  });
}
