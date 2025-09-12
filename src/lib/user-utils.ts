/**
 * Check if a user is currently online based on their last activity time
 * @param lastActive - User's last active timestamp (Date or ISO string)
 * @param timeoutMinutes - Minutes after which user is considered offline (default: 10)
 * @returns boolean - true if user is online, false if offline
 */
export function isUserOnline(
  lastActive: Date | string | null | undefined, 
  timeoutMinutes: number = 10
): boolean {
  if (!lastActive) {
    return false;
  }

  const lastActiveTime = typeof lastActive === 'string' 
    ? new Date(lastActive) 
    : lastActive;

  const currentTime = new Date();
  const timeDifferenceMs = currentTime.getTime() - lastActiveTime.getTime();
  const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds

  return timeDifferenceMs < timeoutMs;
}

/**
 * Get the time since a user was last active
 * @param lastActive - User's last active timestamp (Date or ISO string)
 * @returns object with time difference in different units
 */
export function getTimeSinceLastActive(
  lastActive: Date | string | null | undefined
): {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  isActive: boolean;
} {
  if (!lastActive) {
    return {
      milliseconds: Infinity,
      seconds: Infinity,
      minutes: Infinity,
      hours: Infinity,
      isActive: false
    };
  }

  const lastActiveTime = typeof lastActive === 'string' 
    ? new Date(lastActive) 
    : lastActive;

  const currentTime = new Date();
  const timeDifferenceMs = currentTime.getTime() - lastActiveTime.getTime();

  return {
    milliseconds: timeDifferenceMs,
    seconds: Math.floor(timeDifferenceMs / 1000),
    minutes: Math.floor(timeDifferenceMs / (1000 * 60)),
    hours: Math.floor(timeDifferenceMs / (1000 * 60 * 60)),
    isActive: isUserOnline(lastActive)
  };
}

/**
 * Format last active time for display
 * @param lastActive - User's last active timestamp (Date or ISO string)
 * @param language - Language for formatting ('no' or 'en')
 * @returns formatted string like "2 minutter siden" or "Online nå"
 */
export function formatLastActive(
  lastActive: Date | string | null | undefined,
  language: 'no' | 'en' = 'no'
): string {
  if (!lastActive) {
    return language === 'no' ? 'Aldri' : 'Never';
  }

  const { minutes, hours, isActive } = getTimeSinceLastActive(lastActive);

  if (isActive) {
    return language === 'no' ? 'Online nå' : 'Online now';
  }

  if (language === 'no') {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return days === 1 ? '1 dag siden' : `${days} dager siden`;
    } else if (hours >= 1) {
      return hours === 1 ? '1 time siden' : `${hours} timer siden`;
    } else if (minutes >= 1) {
      return minutes === 1 ? '1 minutt siden' : `${minutes} minutter siden`;
    } else {
      return 'Nylig';
    }
  } else {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours >= 1) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes >= 1) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } else {
      return 'Recently';
    }
  }
}