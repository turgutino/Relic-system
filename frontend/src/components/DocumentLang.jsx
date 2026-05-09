import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function DocumentLang() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = i18n.language || 'en';
    const base = lng.split('-')[0];
    document.documentElement.lang =
      base === 'zh' ? 'zh-Hans' : base === 'az' ? 'az' : 'en';
    document.title = i18n.t('app.documentTitle');
  }, [i18n, i18n.language]);

  return null;
}
