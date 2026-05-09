import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LANG_CODES = /** @type {const} */ (['en', 'az', 'zh']);

function resolveUiLang(lng) {
  const base = (lng || 'en').split('-')[0];
  if (base === 'zh') return 'zh';
  if (base === 'az') return 'az';
  return 'en';
}

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();
  const value = resolveUiLang(i18n.language);

  return (
    <div className={`language-switcher ${className}`.trim()}>
      <label htmlFor="app-language-select" className="language-switcher__label">
        {t('language.switchLabel')}
      </label>
      <select
        id="app-language-select"
        className="language-switcher__select"
        value={value}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        aria-label={t('language.switchLabel')}
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
