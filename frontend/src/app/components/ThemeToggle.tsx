import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--relic-nav-border)] bg-[var(--relic-nav-bg)] ${className}`.trim()}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('nav.themeLight') : t('nav.themeDark')}
      title={t('nav.toggleTheme')}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--relic-border-accent)] bg-[var(--relic-nav-bg)] text-[var(--relic-accent-bright)] outline-none transition-colors hover:border-[var(--relic-accent)] hover:text-[var(--relic-text)] focus-visible:ring-1 focus-visible:ring-[var(--relic-accent)] ${className}`.trim()}
    >
      {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
    </button>
  );
}
