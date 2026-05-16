import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function DocumentLang() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const raw = i18n.language ?? 'en';
    const base = raw.split('-')[0];
    if (base === 'zh') document.documentElement.lang = 'zh-Hans';
    else if (base === 'az') document.documentElement.lang = 'az';
    else document.documentElement.lang = 'en';
    document.title = t('app.documentTitle');
  }, [i18n.language, t]);

  return null;
}
