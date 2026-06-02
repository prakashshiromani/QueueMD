import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const AppearanceTab = ({ config, fontSize, setFontSize }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#2563EB');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compactMode') === 'true');

  const colors = [
    { name: 'Blue', value: '#2563EB' },
    { name: 'Purple', value: '#7C3AED' },
    { name: 'Green', value: '#10B981' },
    { name: 'Pink', value: '#EC4899' }
  ];

  // Apply font size via data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply accent color
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-container', accentColor);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // Apply compact mode via data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-compact', String(compactMode));
    localStorage.setItem('compactMode', String(compactMode));
  }, [compactMode]);

  return (
    <div className={fontSize === 'small' ? 'space-y-3' : fontSize === 'large' ? 'space-y-6' : 'space-y-4'}>
      {/* Theme Mode */}
      <div className={fontSize === 'small' ? 'space-y-2' : fontSize === 'large' ? 'space-y-4' : 'space-y-3'}>
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">
          Theme Mode
        </label>
        <div className={`flex ${fontSize === 'small' ? 'gap-2' : fontSize === 'large' ? 'gap-4' : 'gap-3'}`}>
          {['light', 'dark'].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setTheme(mode);
                toast.success(`${mode.charAt(0).toUpperCase() + mode.slice(1)} mode enabled`);
              }}
              className={`flex-1 ${fontSize === 'small' ? 'py-2 px-3' : fontSize === 'large' ? 'py-4 px-6' : 'py-3 px-4'} rounded-xl border-2 transition flex items-center justify-center gap-2 ${theme === mode
                ? 'border-primary-container bg-primary-container/10 text-primary font-semibold'
                : 'border-border-muted text-text-secondary hover:border-border-muted/70'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {mode === 'light' ? 'light_mode' : 'dark_mode'}
              </span>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Font Accessibility Size */}
      <div className={fontSize === 'small' ? 'space-y-2' : fontSize === 'large' ? 'space-y-4' : 'space-y-3'}>
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-text-secondary">
          Font Accessibility Size
        </label>
        <div className={`flex ${fontSize === 'small' ? 'gap-2' : fontSize === 'large' ? 'gap-4' : 'gap-3'}`}>
          {[
            { value: 'small', label: 'Small', icon: 'text_fields', px: '12px' },
            { value: 'medium', label: 'Medium', icon: 'format_size', px: '16px' },
            { value: 'large', label: 'Large', icon: 'text_increase', px: '20px' }
          ].map((size) => (
            <button
              key={size.value}
              onClick={() => setFontSize(size.value)}
              className={`flex-1 ${fontSize === 'small' ? 'py-2 px-3' : fontSize === 'large' ? 'py-4 px-6' : 'py-3 px-4'} rounded-xl border-2 transition flex flex-col items-center justify-center gap-1 ${fontSize === size.value
                ? 'border-primary-container bg-primary-container/10 text-primary font-semibold'
                : 'border-border-muted text-text-secondary hover:border-border-muted/70'
                }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: size.value === 'small' ? '16px' : size.value === 'large' ? '24px' : '20px' }}
              >
                {size.icon}
              </span>
              <span style={{ fontSize: size.px, fontWeight: fontSize === size.value ? '700' : '400' }}>
                {size.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-secondary">
          Current: <span className="font-semibold text-text-primary">{fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}</span>
          {fontSize === 'small' && ' — Compact view for small screens'}
          {fontSize === 'large' && ' — Accessibility large text mode'}
        </p>
      </div>

      {/* Compact Dashboard View */}
      <div className={`flex items-center justify-between ${fontSize === 'small' ? 'p-3' : fontSize === 'large' ? 'p-6' : 'p-4'} bg-bg-secondary rounded-xl border border-border-muted/50 dark:border-white/5`}>
        <div>
          <p className="font-medium text-text-primary mb-0.5 text-sm">Compact Dashboard View</p>
          <p className="text-xs text-text-secondary">Reduce queue card margins for high-density lists</p>
        </div>
        <button
          role="switch"
          aria-checked={compactMode}
          onClick={() => {
            const next = !compactMode;
            setCompactMode(next);
            toast.success(`Compact mode ${next ? 'enabled' : 'disabled'}`);
          }}
          className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
          style={{
            backgroundColor: compactMode ? 'var(--primary-container)' : 'var(--border-muted)'
          }}
        >
          <span
            className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 mt-0.5"
            style={{ transform: compactMode ? 'translateX(20px)' : 'translateX(2px)' }}
          />
        </button>
      </div>

      {/* Info Banner */}
      <div className={`${fontSize === 'small' ? 'p-3' : fontSize === 'large' ? 'p-6' : 'p-4'} bg-primary-container/10 rounded-xl border border-primary-container/30`}>
        <p className="text-xs text-text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--primary-container)' }}>info</span>
          Changes apply immediately across the entire application
        </p>
      </div>
    </div>
  );
};
