import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  autoNightShift: boolean;
  setAutoNightShift: (enabled: boolean) => void;
  isNightShiftActive: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'zenithrx_theme_mode';
const AUTO_NIGHT_SHIFT_KEY = 'zenithrx_auto_night_shift';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for theme:', e);
    }
    return 'system';
  });

  const [autoNightShift, setAutoNightShiftState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTO_NIGHT_SHIFT_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Calculate if current local time is in medical night-shift hours (19:00 - 06:30)
  const isNightShiftHours = useCallback(() => {
    const hours = new Date().getHours();
    const minutes = new Date().getMinutes();
    const totalMinutes = hours * 60 + minutes;
    // 19:00 is 1140 minutes, 06:30 is 390 minutes
    return totalMinutes >= 1140 || totalMinutes < 390;
  }, []);

  const [isNightShiftActive, setIsNightShiftActive] = useState<boolean>(isNightShiftHours());

  // Determine system dark preference
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Compute resolved theme taking into account manual mode, auto night shift, or system OS
  const computeResolvedTheme = useCallback((): ResolvedTheme => {
    if (autoNightShift && isNightShiftHours()) {
      return 'dark';
    }
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  }, [theme, autoNightShift, isNightShiftHours, getSystemTheme]);

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(computeResolvedTheme);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Failed to save theme in localStorage:', e);
    }
  };

  const setAutoNightShift = (enabled: boolean) => {
    setAutoNightShiftState(enabled);
    try {
      localStorage.setItem(AUTO_NIGHT_SHIFT_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to save autoNightShift in localStorage:', e);
    }
  };

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme]);

  // Apply theme to DOM documentElement and body
  useEffect(() => {
    const currentResolved = computeResolvedTheme();
    setResolvedTheme(currentResolved);

    const root = document.documentElement;
    const body = document.body;

    if (currentResolved === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [theme, autoNightShift, computeResolvedTheme]);

  // Real-time listener for OS preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (theme === 'system' && !autoNightShift) {
        const currentResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(currentResolved);
        if (currentResolved === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme, autoNightShift]);

  // Hourly timer to recheck smart night shift
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const nightNow = isNightShiftHours();
      setIsNightShiftActive(nightNow);
      if (autoNightShift) {
        setResolvedTheme(nightNow ? 'dark' : (theme === 'system' ? getSystemTheme() : theme));
      }
    }, 60000); // every minute

    return () => clearInterval(checkInterval);
  }, [autoNightShift, isNightShiftHours, theme, getSystemTheme]);

  // Global Keyboard Shortcut: Ctrl + Shift + D or Alt + T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) || (e.altKey && (e.key === 'T' || e.key === 't'))) {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        autoNightShift,
        setAutoNightShift,
        isNightShiftActive,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
