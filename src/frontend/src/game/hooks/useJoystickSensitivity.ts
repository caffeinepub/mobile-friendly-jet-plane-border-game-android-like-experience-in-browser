import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jetfighter-joystick-sensitivity';
const DEFAULT_SENSITIVITY = 2.0;
const MIN_SENSITIVITY = 0.5;
const MAX_SENSITIVITY = 2.0;

/**
 * Hook to manage joystick sensitivity with localStorage persistence.
 * Returns current sensitivity value and a setter function.
 * Validates and clamps stored values to prevent out-of-range or corrupted data.
 */
export function useJoystickSensitivity() {
  const [sensitivity, setSensitivity] = useState<number>(() => {
    // Initialize from localStorage on mount with validation
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = parseFloat(stored);
        // Validate: must be finite number within range
        if (
          !isNaN(parsed) && 
          isFinite(parsed) && 
          parsed >= MIN_SENSITIVITY && 
          parsed <= MAX_SENSITIVITY
        ) {
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
      // Clamp value before storing to ensure it's always in valid range
      const clampedValue = Math.max(MIN_SENSITIVITY, Math.min(MAX_SENSITIVITY, sensitivity));
      localStorage.setItem(STORAGE_KEY, clampedValue.toString());
    } catch (error) {
      console.warn('Failed to save sensitivity to localStorage:', error);
    }
  }, [sensitivity]);

  // Wrap setter to enforce clamping
  const setClampedSensitivity = (value: number) => {
    const clamped = Math.max(MIN_SENSITIVITY, Math.min(MAX_SENSITIVITY, value));
    setSensitivity(clamped);
  };

  return { sensitivity, setSensitivity: setClampedSensitivity };
}
