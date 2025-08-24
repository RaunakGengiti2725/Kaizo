// Haptic feedback utilities for mobile devices

export interface HapticPattern {
  duration: number;
  delay?: number;
}

export class HapticFeedback {
  private static isSupported(): boolean {
    return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }

  private static vibrate(pattern: number | number[]): boolean {
    if (!this.isSupported()) return false;
    
    try {
      return navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  }

  // Success feedback - short, satisfying pulse
  public static success(): boolean {
    return this.vibrate([50, 30, 50]);
  }

  // Error feedback - longer, attention-grabbing pulse
  public static error(): boolean {
    return this.vibrate([100, 50, 100, 50, 100]);
  }

  // Warning feedback - medium pulse
  public static warning(): boolean {
    return this.vibrate([75, 50, 75]);
  }

  // Light tap - for button presses
  public static tap(): boolean {
    return this.vibrate(25);
  }

  // Camera capture feedback - satisfying click
  public static capture(): boolean {
    return this.vibrate([30, 20, 50]);
  }

  // Processing feedback - rhythmic pattern
  public static processing(): boolean {
    return this.vibrate([50, 100, 50, 100, 50]);
  }

  // Custom pattern
  public static custom(pattern: number[]): boolean {
    return this.vibrate(pattern);
  }

  // Stop any ongoing vibration
  public static stop(): boolean {
    return this.vibrate(0);
  }
}

// Convenience functions for easier use
export const haptics = {
  success: () => HapticFeedback.success(),
  error: () => HapticFeedback.error(),
  warning: () => HapticFeedback.warning(),
  tap: () => HapticFeedback.tap(),
  capture: () => HapticFeedback.capture(),
  processing: () => HapticFeedback.processing(),
  stop: () => HapticFeedback.stop(),
  custom: (pattern: number[]) => HapticFeedback.custom(pattern)
};

export default haptics;
