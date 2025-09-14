// Consistent date formatting that works the same on server and client
export function formatDateTime(dateTime: string, language: 'no' | 'en' = 'no'): string {
  try {
    const date = new Date(dateTime);
    
    // Use UTC methods to ensure consistency
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Create consistent time string
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Use simple date comparison without timezone issues
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const appointmentDate = new Date(year, month, day);
    
    const diffTime = appointmentDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `${language === 'no' ? 'I dag' : 'Today'} ${timeString}`;
    } else if (diffDays === 1) {
      return `${language === 'no' ? 'I morgen' : 'Tomorrow'} ${timeString}`;
    } else {
      // Simple date format that's consistent
      const dayNum = day;
      const monthNum = month + 1;
      return `${dayNum}/${monthNum} ${timeString}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateTime;
  }
}

// Server-safe date comparison
export function isAppointmentCurrent(dateTime: string, duration: number): boolean {
  try {
    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
    const now = new Date();
    return endTime >= now;
  } catch (error) {
    return false;
  }
}