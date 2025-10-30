/**
 * Week calculation utilities with department-specific cutoffs
 * 
 * Standard departments: Thursday-Wednesday cutoff (week starts on Thursday, day_of_week = 4)
 * 10PM Department: Wednesday-Tuesday cutoff (week starts on Wednesday, day_of_week = 3)
 */

/**
 * Get the week start date based on department and role
 * @param date - The date to calculate from
 * @param department - Optional department name (if '10PM', uses Wednesday cutoff)
 * @param role - Optional role (Admin/Manager always use standard cutoff)
 * @param roles - Optional roles array (if includes Admin/Manager, uses standard cutoff)
 * @returns The start date of the week
 */
export const getWeekStart = (date: Date, department?: string | null, role?: string | null, roles?: string[] | null): Date => {
  const day = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  
  // 10PM Department has Wednesday-Tuesday cutoff (week starts Wednesday, day_of_week = 3)
  if (department === '10PM') {
    // Calculate days to go back to reach Wednesday
    if (day === 0) weekStart.setDate(date.getDate() - 4); // Sunday -> back 4 to Wednesday
    else if (day === 1) weekStart.setDate(date.getDate() - 5); // Monday -> back 5
    else if (day === 2) weekStart.setDate(date.getDate() - 6); // Tuesday -> back 6
    else if (day === 3) weekStart.setDate(date.getDate()); // Wednesday -> same day
    else if (day === 4) weekStart.setDate(date.getDate() - 1); // Thursday -> back 1
    else if (day === 5) weekStart.setDate(date.getDate() - 2); // Friday -> back 2
    else if (day === 6) weekStart.setDate(date.getDate() - 3); // Saturday -> back 3
  } else {
    // Standard: Thursday-Wednesday cutoff (week starts Thursday, day_of_week = 4)
    if (day === 0) weekStart.setDate(date.getDate() - 3); // Sunday -> back 3 to Thursday
    else if (day === 1) weekStart.setDate(date.getDate() - 4); // Monday -> back 4
    else if (day === 2) weekStart.setDate(date.getDate() - 5); // Tuesday -> back 5
    else if (day === 3) weekStart.setDate(date.getDate() - 6); // Wednesday -> back 6
    else if (day === 4) weekStart.setDate(date.getDate()); // Thursday -> same day
    else if (day === 5) weekStart.setDate(date.getDate() - 1); // Friday -> back 1
    else if (day === 6) weekStart.setDate(date.getDate() - 2); // Saturday -> back 2
  }
  
  return weekStart;
};

/**
 * Get the week end date (6 days after week start)
 * @param weekStart - The start date of the week
 * @returns The end date of the week
 */
export const getWeekEnd = (weekStart: Date): Date => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

/**
 * Get the day order for displaying days of week based on department
 * @param department - Optional department name
 * @returns Array of day objects with label, value, and fullName
 */
export const getDaysOfWeek = (department?: string | null) => {
  // 10PM Department: Wednesday-Tuesday
  if (department === '10PM') {
    return [
      { label: 'Wed', value: 3, fullName: 'Wednesday' },
      { label: 'Thu', value: 4, fullName: 'Thursday' },
      { label: 'Fri', value: 5, fullName: 'Friday' },
      { label: 'Sat', value: 6, fullName: 'Saturday' },
      { label: 'Sun', value: 0, fullName: 'Sunday' },
      { label: 'Mon', value: 1, fullName: 'Monday' },
      { label: 'Tue', value: 2, fullName: 'Tuesday' },
    ];
  }
  
  // Standard: Thursday-Wednesday
  return [
    { label: 'Thu', value: 4, fullName: 'Thursday' },
    { label: 'Fri', value: 5, fullName: 'Friday' },
    { label: 'Sat', value: 6, fullName: 'Saturday' },
    { label: 'Sun', value: 0, fullName: 'Sunday' },
    { label: 'Mon', value: 1, fullName: 'Monday' },
    { label: 'Tue', value: 2, fullName: 'Tuesday' },
    { label: 'Wed', value: 3, fullName: 'Wednesday' },
  ];
};

/**
 * Get the start day of week value based on department and role
 * @param department - Optional department name
 * @param role - Optional role (Admin/Manager always use standard cutoff)
 * @param roles - Optional roles array (if includes Admin/Manager, uses standard cutoff)
 * @returns The day_of_week value for the start day (3 for 10PM, 4 for others)
 */
export const getStartDayOfWeek = (department?: string | null, role?: string | null, roles?: string[] | null): number => {
  return department === '10PM' ? 3 : 4;
};

/**
 * Calculate the actual date for a given day_of_week value relative to week start
 * @param weekStart - The start date of the week
 * @param dayOfWeek - The day_of_week value (0-6)
 * @param department - Optional department name
 * @param role - Optional role (Admin/Manager always use standard cutoff)
 * @param roles - Optional roles array (if includes Admin/Manager, uses standard cutoff)
 * @returns The actual date
 */
export const getActualDate = (weekStart: Date, dayOfWeek: number, department?: string | null, role?: string | null, roles?: string[] | null): Date => {
  const actualDate = new Date(weekStart);
  const startDay = getStartDayOfWeek(department, role, roles);
  
  // Calculate offset from the week start day
  const offset = (dayOfWeek - startDay + 7) % 7;
  actualDate.setDate(weekStart.getDate() + offset);
  
  return actualDate;
};
