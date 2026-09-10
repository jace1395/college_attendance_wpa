import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'light', label: 'Light', emoji: '☀️' },
    { value: 'dark', label: 'Dark', emoji: '🌙' },
    { value: 'system', label: 'System', emoji: '💻' }
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-slate-800 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors flex items-center justify-center w-9 h-9"
      >
        <span className="text-lg leading-none">{options.find(o => o.value === theme)?.emoji || options[2].emoji}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTheme(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                theme === opt.value 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-medium' 
                  : 'text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <span className="text-base">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
