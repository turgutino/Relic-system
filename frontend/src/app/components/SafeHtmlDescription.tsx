import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { sanitizeRelicHtml } from '@/utils/sanitizeRelicHtml';

type Props = {
  html: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Renders relic/catalog HTML descriptions after sanitizing tags and attributes.
 */
export function SafeHtmlDescription({ html, className, style }: Props) {
  const safe = useMemo(() => sanitizeRelicHtml(html), [html]);

  if (!safe) return null;

  return (
    <div
      className={className}
      style={style}
      // Safe after sanitizeRelicHtml allowlist + attribute stripping
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
