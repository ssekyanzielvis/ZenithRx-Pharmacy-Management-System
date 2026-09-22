import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Sparkles, Clock, Check, ChevronDown } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'compact' | 'segmented' | 'menu' | 'floating';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  className = '',
  showLabel = false,
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme, autoNightShift, setAutoNightShift, isNightShiftActive } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Segmented Pill Variant (☀️ Light | 🌙 Dark | 💻 Auto)
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Clinical Light Day Mode"
        >
          <Sun className="w-3.5 h-3.5" />
          {showLabel && <span>Light</span>}
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-900 text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Clinical Night Shift Mode"
        >
          <Moon className="w-3.5 h-3.5" />
          {showLabel && <span>Dark</span>}
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Sync with OS System Theme"
        >
          <Laptop className="w-3.5 h-3.5" />
          {showLabel && <span>Auto</span>}
        </button>
      </div>
    );
  }

  // 2. Dropdown Menu Variant (with smart features)
  if (variant === 'menu') {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-xs"
          title="Choose Theme & Night-Shift Settings"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span className="capitalize">
            {theme === 'system' ? 'System' : theme === 'dark' ? 'Night Shift' : 'Clinical Day'}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Appearance Mode
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                ZenithRx Visual Ergonomics
              </span>
            </div>

            <button
              onClick={() => {
                setTheme('light');
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  <Sun className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Clinical Light</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Daytime clinical white</p>
                </div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                setTheme('dark');
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                theme === 'dark'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                  <Moon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Night Shift (Dark)</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Low glare dark workstation</p>
                </div>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                setTheme('system');
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                theme === 'system'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="font-bold">System Sync</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Match operating system</p>
                </div>
              </div>
              {theme === 'system' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </button>

            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Smart Night Shift</p>
                    <p className="text-[10px] text-slate-500">Auto dark (19:00 - 06:30)</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoNightShift}
                  onChange={(e) => setAutoNightShift(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono">
              Shortcut: <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Ctrl+Shift+D</kbd>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Floating Quick Switcher Variant
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-5 left-5 z-50 animate-fade-in ${className}`}>
        <div className="flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition cursor-pointer shadow-xs"
            title={`Flip to ${resolvedTheme === 'light' ? 'Night Shift (Dark)' : 'Clinical Light'} Mode (Ctrl+Shift+D)`}
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Night Shift</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Clinical Light</span>
              </>
            )}
          </button>

          <span className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
            Ctrl+Shift+D
          </span>
        </div>
      </div>
    );
  }

  // 4. Compact Icon Button (Default)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-xs relative group flex items-center justify-center ${className}`}
      title={`Current: ${resolvedTheme === 'dark' ? 'Night Shift' : 'Clinical Light'} (Click to switch or press Ctrl+Shift+D)`}
      aria-label="Toggle dark/light appearance mode"
    >
      {resolvedTheme === 'dark' ? (
        <Moon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
      )}
      {showLabel && (
        <span className="ml-1.5 text-xs font-semibold">
          {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
