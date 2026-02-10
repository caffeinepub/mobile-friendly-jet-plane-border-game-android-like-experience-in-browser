import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jetfighter-joystick-sensitivity';
const DEFAULT_SENSITIVITY = 2.0; // Default to 2.0 as requested

/**
 * Hook to manage joystick sensitivity with localStorage persistence.
 * Returns current sensitivity value and a setter function.
 */
export function useJoystickSensitivity() {
  const [sensitivity, setSensitivity] = useState<number>(() => {
    // Initialize from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to read sensitivity from localStorage:', error);
    }
    return DEFAULT_SENSITIVITY;
  });

  // Persist to localStorage whenever sensitivity changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, sensitivity.toString());
    } catch (error) {
      console.warn('Failed to save sensitivity to localStorage:', error);
    }
  }, [sensitivity]);

  return { sensitivity, setSensitivity };
}
