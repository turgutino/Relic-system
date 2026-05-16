import { useTranslation } from 'react-i18next';

const LANG_CODES = ['en', 'zh', 'az'] as const;

function resolveUiLang(lng: string | undefined): (typeof LANG_CODES)[number] {
  const base = (lng || 'en').split('-')[0];
  if (base === 'zh') return 'zh';
  if (base === 'az') return 'az';
  return 'en';
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const value = resolveUiLang(i18n.language);

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <label
        htmlFor="app-language-select"
        className="sr-only"
      >
        {t('language.switchLabel')}
      </label>
      <select
        id="app-language-select"
        value={value}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        aria-label={t('language.switchLabel')}
        className="rounded-full border border-[var(--relic-border-accent)] bg-[var(--relic-nav-bg)] px-3 py-2 text-xs text-[var(--relic-text)] outline-none transition-colors hover:border-[var(--relic-accent-bright)] focus:ring-1 focus:ring-[var(--relic-accent-bright)]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {LANG_CODES.map((code) => (
          <option key={code} value={code}>
            {t(`language.${code}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
