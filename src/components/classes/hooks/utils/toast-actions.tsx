
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Export a function that returns JSX for the toast action button
export function createScheduleAction(classId: string) {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate(`/classes/${classId}/schedules`)}
      className="bg-mckaynine-600 hover:bg-mckaynine-700 text-white px-4 py-2 rounded text-xs"
    >
      Create Schedule
    </button>
  );
}
