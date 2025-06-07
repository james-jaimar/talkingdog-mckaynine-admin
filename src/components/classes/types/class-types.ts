
// Export the same class types used in the schema for consistency
export const CLASS_TYPES = ['Puppy', 'EO', 'CGC Bronze', 'CGC Silver', 'Beginner', 'Novice', 'WT', 'A-Test', 'Yoga'] as const;

export type ClassType = typeof CLASS_TYPES[number];
