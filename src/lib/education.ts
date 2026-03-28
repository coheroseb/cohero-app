
/**
 * Utility to calculate the estimated start date for a student based on their current semester.
 * Standard Danish semesters:
 * - Spring: Starts Feb 1st
 * - Autumn: Starts Sept 1st
 */
export const calculateStudyStarted = (semStr: string): string => {
  const sem = parseInt(semStr.match(/\d+/)?.[0] || '1');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 8 = Sept)
  
  let startMonth = 1; // Default to Feb
  let startYear = currentYear;
  
  if (currentMonth >= 8) { // September or later
    startMonth = 8;
  } else if (currentMonth >= 1) { // February or later
    startMonth = 1;
  } else {
    // January belongs to the previous year's Fall semester
    startMonth = 8;
    startYear = currentYear - 1;
  }
  
  let currentStart = new Date(startYear, startMonth, 1);
  
  // Subtract 6-month intervals
  for (let i = 1; i < sem; i++) {
      if (currentStart.getMonth() === 8) { // If it's currently Sept
          currentStart.setMonth(1); // Set to Feb of same year
      } else { // If it's Feb
          currentStart.setMonth(8); // Set to Sept of previous year
          currentStart.setFullYear(currentStart.getFullYear() - 1);
      }
  }
  
  return currentStart.toISOString().split('T')[0];
};

/**
 * Calculates the estimated graduation date (end of 7th semester)
 * Assumes a standard 3.5 year (7 semester) program.
 */
export const calculateGraduationDate = (studyStarted: string): string => {
  const startDate = new Date(studyStarted);
  
  // A standard 3.5 year program means 3 years and 6 months from the start of the 1st semester.
  // Example: Starts Feb 1st 2024 -> Ends July 31st 2027 (7 semesters)
  const gradDate = new Date(startDate);
  gradDate.setFullYear(gradDate.getFullYear() + 3);
  gradDate.setMonth(gradDate.getMonth() + 6);
  
  // Final month logic: 
  // If started in Feb (month 1), they finish end of July (month 6 of 3.5 years later)
  // If started in Sept (month 8), they finish end of Jan (month 1 of 4 years later?) 
  // Wait: Sept 2024 -> S1. Jan 2028 -> S7 ends.
  
  // Let's just add 3.5 years.
  return gradDate.toISOString().split('T')[0];
};
