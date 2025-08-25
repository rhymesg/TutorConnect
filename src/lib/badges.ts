/**
 * Centralized badge system for TutorConnect
 * Activity-based badges with levels (Bronze, Silver, Gold, Platinum)
 */

export interface ActivityBadge {
  level: string;
  icon: string;
  color: string; // Tailwind color classes
}

/**
 * Calculate teacher badge based on sessions and students
 */
export function getTeacherBadge(sessions: number, students: number): ActivityBadge | null {
  if (sessions >= 200 && students >= 10) {
    return { level: 'Platina', color: 'text-purple-600 bg-purple-100', icon: '🏆' };
  } else if (sessions >= 50 && students >= 5) {
    return { level: 'Gull', color: 'text-yellow-600 bg-yellow-100', icon: '🥇' };
  } else if (sessions >= 10 && students >= 2) {
    return { level: 'Sølv', color: 'text-slate-500 bg-slate-200', icon: '🥈' };
  } else if (sessions >= 2 && students >= 1) {
    return { level: 'Bronse', color: 'text-orange-800 bg-orange-200', icon: '🥉' };
  }
  return null;
}

/**
 * Calculate student badge based on sessions and teachers
 */
export function getStudentBadge(sessions: number, teachers: number): ActivityBadge | null {
  if (sessions >= 200 && teachers >= 10) {
    return { level: 'Platina', color: 'text-purple-600 bg-purple-100', icon: '🏆' };
  } else if (sessions >= 50 && teachers >= 5) {
    return { level: 'Gull', color: 'text-yellow-600 bg-yellow-100', icon: '🥇' };
  } else if (sessions >= 10 && teachers >= 2) {
    return { level: 'Sølv', color: 'text-slate-500 bg-slate-200', icon: '🥈' };
  } else if (sessions >= 2 && teachers >= 1) {
    return { level: 'Bronse', color: 'text-orange-800 bg-orange-200', icon: '🥉' };
  }
  return null;
}

