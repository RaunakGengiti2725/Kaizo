import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { userPreferences } from '@/services/userPreferences';

export type DietMode = 'vegan' | 'vegetarian';

interface DietModeContextValue {
  mode: DietMode;
  setMode: (m: DietMode) => void;
}

const DietModeContext = createContext<DietModeContextValue | undefined>(undefined);

const STORAGE_KEY = 'vv_diet_mode';

interface ProviderProps { children: ReactNode }

export const DietModeProvider = ({ children }: ProviderProps) => {
  const [mode, setModeState] = useState<DietMode>(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as DietMode | null) : null;
    return stored === 'vegetarian' ? 'vegetarian' : 'vegan';
  });

  // Persist to localStorage and sync to userPreferences
  const setMode = (m: DietMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {}
    // Best-effort sync to preferences
    (async () => {
      try {
        const existing = await userPreferences.getPreferences();
        if (existing) {
          await userPreferences.updatePreferences({ dietaryPreference: m });
        } else {
          await userPreferences.savePreferences({ dietaryPreference: m, allergies: [], completedAt: new Date().toISOString() });
        }
      } catch (e) {
        console.warn('Failed to sync diet mode to preferences:', e);
      }
    })();
  };

  // Initialize from userPreferences (overrides local if present)
  useEffect(() => {
    (async () => {
      try {
        const pref = await userPreferences.getDietaryPreference();
        if (pref && pref !== mode) {
          setModeState(pref);
          try { localStorage.setItem(STORAGE_KEY, pref); } catch {}
        }
      } catch {}
    })();
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return (
    <DietModeContext.Provider value={value}>
      {children}
    </DietModeContext.Provider>
  );
};

export const useDietMode = () => {
  const ctx = useContext(DietModeContext);
  if (!ctx) throw new Error('useDietMode must be used within DietModeProvider');
  return ctx;
};


