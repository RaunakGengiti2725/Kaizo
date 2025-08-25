import { supabase, supaReady } from './supabaseClient';

export interface UserPreferences {
  dietaryPreference: 'vegan' | 'vegetarian';
  allergies: string[];
  completedAt: string;
  userId?: string; // For authenticated users
}

interface StoredPreferences extends UserPreferences {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

class UserPreferencesService {
  private static instance: UserPreferencesService;
  private cachedPreferences: UserPreferences | null = null;
  private readonly STORAGE_KEY = 'vegan_vision_onboarding';
  private readonly COMPLETION_KEY = 'vegan_vision_onboarding_completed';

  private constructor() {}

  static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  /**
   * Save user preferences (called during onboarding)
   */
  async savePreferences(preferences: UserPreferences, userId?: string): Promise<void> {
    try {
      const prefsWithUser = { ...preferences, userId };
      
      // Always save to localStorage as fallback
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefsWithUser));
      localStorage.setItem(this.COMPLETION_KEY, 'true');
      
      // Cache the preferences
      this.cachedPreferences = prefsWithUser;

      // If authenticated and Supabase is available, save to database
      if (supaReady && userId) {
        await this.saveToSupabase(prefsWithUser);
      }

      console.log('✅ User preferences saved successfully:', prefsWithUser);
    } catch (error) {
      console.error('❌ Error saving user preferences:', error);
      // Don't throw - localStorage save should have succeeded
    }
  }

  /**
   * Get user preferences with fallback chain: Cache → Supabase → localStorage
   */
  async getPreferences(userId?: string): Promise<UserPreferences | null> {
    try {
      // Return cached if available
      if (this.cachedPreferences) {
        return this.cachedPreferences;
      }

      // Try Supabase first if authenticated
      if (supaReady && userId) {
        const supabasePrefs = await this.getFromSupabase(userId);
        if (supabasePrefs) {
          this.cachedPreferences = supabasePrefs;
          return supabasePrefs;
        }
      }

      // Fallback to localStorage
      const localPrefs = this.getFromLocalStorage();
      if (localPrefs) {
        this.cachedPreferences = localPrefs;
        
        // If we have user ID but no Supabase record, sync to Supabase
        if (supaReady && userId && !localPrefs.userId) {
          await this.saveToSupabase({ ...localPrefs, userId });
        }
        
        return localPrefs;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      // Try localStorage as last resort
      return this.getFromLocalStorage();
    }
  }

  /**
   * Update existing preferences (for future profile settings)
   */
  async updatePreferences(updates: Partial<UserPreferences>, userId?: string): Promise<void> {
    const current = await this.getPreferences(userId);
    if (!current) {
      throw new Error('No existing preferences found to update');
    }

    const updated = { ...current, ...updates, userId: userId || current.userId };
    await this.savePreferences(updated, userId);
  }

  /**
   * Clear preferences (for logout/reset)
   */
  clearPreferences(): void {
    this.cachedPreferences = null;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.COMPLETION_KEY);
  }

  /**
   * Check if onboarding is completed
   */
  isOnboardingCompleted(): boolean {
    return localStorage.getItem(this.COMPLETION_KEY) === 'true';
  }

  /**
   * Generate preferences summary for Gemini AI
   */
  async getPreferencesForAI(userId?: string): Promise<string> {
    const prefs = await this.getPreferences(userId);
    if (!prefs) {
      return 'No specific dietary preferences or allergies provided.';
    }

    let summary = `User is ${prefs.dietaryPreference}.`;
    
    if (prefs.allergies && prefs.allergies.length > 0) {
      const allergiesList = prefs.allergies.join(', ');
      summary += ` CRITICAL ALLERGIES: ${allergiesList}. These ingredients must be completely avoided and highlighted as unsafe.`;
    }

    return summary;
  }

  /**
   * Get allergy warnings for scanning
   */
  async getAllergyWarnings(userId?: string): Promise<string[]> {
    const prefs = await this.getPreferences(userId);
    return prefs?.allergies || [];
  }

  /**
   * Get dietary preference for filtering
   */
  async getDietaryPreference(userId?: string): Promise<'vegan' | 'vegetarian' | null> {
    const prefs = await this.getPreferences(userId);
    return prefs?.dietaryPreference || null;
  }

  // Private methods
  private async saveToSupabase(preferences: UserPreferences): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: preferences.userId,
        dietary_preference: preferences.dietaryPreference,
        allergies: preferences.allergies,
        completed_at: preferences.completedAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
  }

  private async getFromSupabase(userId: string): Promise<UserPreferences | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      dietaryPreference: data.dietary_preference,
      allergies: data.allergies || [],
      completedAt: data.completed_at,
      userId: data.user_id,
    };
  }

  private getFromLocalStorage(): UserPreferences | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Validate the structure
      if (!parsed.dietaryPreference || !Array.isArray(parsed.allergies)) {
        console.warn('Invalid preferences format in localStorage');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error parsing preferences from localStorage:', error);
      return null;
    }
  }
}

// Export singleton instance
export const userPreferences = UserPreferencesService.getInstance();

// Export types
export type { StoredPreferences };
