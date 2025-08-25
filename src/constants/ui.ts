/**
 * UI Constants for TutorConnect
 * Centralized UI configuration values
 */

// Profile popup window dimensions
export const PROFILE_POPUP = {
  width: 850,
  height: 700,
  features: 'resizable=yes,scrollbars=yes',
} as const;

/**
 * Helper function to open profile popup window
 */
export function openProfilePopup(userId: string): void {
  const left = window.screenX + (window.innerWidth - PROFILE_POPUP.width) / 2;
  const top = window.screenY + (window.innerHeight - PROFILE_POPUP.height) / 2;
  
  window.open(
    `/profile/${userId}`,
    'userProfile',
    `width=${PROFILE_POPUP.width},height=${PROFILE_POPUP.height},left=${left},top=${top},${PROFILE_POPUP.features}`
  );
}