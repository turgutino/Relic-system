import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import type { Relic } from '@/models/relic';
import { normalizeRelic } from '@/models/relic';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { SafeHtmlDescription } from '@/app/components/SafeHtmlDescription';
import { useCompareSelection } from '@/app/context/CompareSelectionContext';
import { relicDescriptionPlainText, sanitizeRelicHtml } from '@/utils/sanitizeRelicHtml';

function normVal(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

function rowHighlight(values: string[]): boolean {
  if (values.length < 2) return false;
  const n0 = normVal(values[0]);
  return values.some((v) => normVal(v) !== n0);
}

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

export function ComparePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selected, removeId } = useCompareSelection();

  const [relics, setRelics] = useState<(Relic | null)[]>([]);
  const [loading, setLoading] = useState(true);

  const idsKey = useMemo(() => selected.map((s) => s.id).join('|'), [selected]);

  const close = useCallback(() => {
    navigate('/catalog');
  }, [navigate]);

  useEffect(() => {
    if (selected.length < 2) {
      navigate('/catalog', { replace: true });
    }
  }, [selected.length, navigate]);

  useEffect(() => {
    if (selected.length < 2) return undefined;

    const ac = new AbortController();
    setLoading(true);
    const ids = selected.map((s) => s.id);

    Promise.all(
      ids.map((id) =>
        fetch(`/relics/${encodeURIComponent(id)}`, { signal: ac.signal }).then((res) => {
          if (!res.ok) return null;
          return res.json();
        }),
      ),
    )
      .then((rows) => {
        if (ac.signal.aborted) return;
        setRelics(rows.map((raw) => normalizeRelic(raw)));
      })
      .catch(() => {
        if (!ac.signal.aborted) setRelics(ids.map(() => null));
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [idsKey, selected]);

  useEffect(() => {
    if (selected.length < 2) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, selected.length]);

  const handleRemoveColumn = useCallback(
    (id: string) => {
      removeId(id);
    },
    [removeId],
  );

  const missing = t('relicDetail.missingValue');

  if (selected.length < 2) {
    return null;
  }

  const rowDefs: { key: string; label: string; get: (r: Relic | null) => string }[] = [
    { key: 'name', label: t('compare.rowName'), get: (r) => r?.name?.trim() || '' },
    { key: 'dynasty', label: t('compare.rowDynasty'), get: (r) => r?.dynasty?.trim() || '' },
    { key: 'museum', label: t('compare.rowMuseum'), get: (r) => r?.museum?.trim() || '' },
    { key: 'material', label: t('compare.rowMaterial'), get: (r) => r?.material?.trim() || '' },
    { key: 'date', label: t('compare.rowDate'), get: (r) => r?.date?.trim() || '' },
    { key: 'artist', label: t('compare.rowArtist'), get: (r) => r?.artist?.trim() || '' },
    { key: 'description', label: t('compare.rowDescription'), get: (r) => r?.description?.trim() || '' },
  ];

  const cols: (Relic | null)[] = selected.map((_, i) => relics[i] ?? null);

  return (
    <div className="min-h-screen bg-[var(--relic-page)] pt-24 sm:pt-28 pb-14 sm:pb-16 text-[var(--relic-text)] transition-colors">
      <div className="mx-auto max-w-[1400px] w-full min-w-0 px-3 sm:px-4 md:px-8">
        <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap">
          <div>
            <h1 className="mb-2 text-2xl md:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('compare.pageTitle')}
            </h1>
            <p className="text-sm text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('compare.pageSubtitle')}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 min-[420px]:flex-row sm:w-auto sm:flex-wrap sm:items-center">
            {selected.length < 3 ? (
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--relic-border-accent)] bg-[var(--relic-accent-muted-bg)] px-4 py-2 text-sm text-[var(--relic-text)] hover:border-[var(--relic-accent-bright)] min-[420px]:w-auto"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <Plus size={18} />
                {t('compare.addAnother')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--relic-border-muted)] px-4 py-2 text-sm text-[var(--relic-text)] hover:bg-[var(--relic-interactive-hover)] min-[420px]:w-auto"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <X size={18} />
              {t('compare.close')}
            </button>
          </div>
        </header>

        {loading ? (
          <p className="text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t('compare.loading')}
          </p>
        ) : (
          <div className="max-w-full overflow-x-auto rounded-3xl [scrollbar-gutter:stable]" style={panel}>
            <table className="w-full min-w-[640px] border-collapse text-left sm:min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--relic-border)]">
                  <th
                    scope="col"
                    className="sticky left-0 z-[1] w-28 min-w-[104px] bg-[var(--relic-panel-solid)] px-2 py-4 align-bottom text-xs font-medium uppercase tracking-wide text-[var(--relic-text-subtle)] sm:w-36 sm:min-w-[120px] sm:px-3 md:w-44"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                  {selected.map((stub, i) => {
                    const r = cols[i];
                    return (
                      <th key={stub.id} scope="col" className="px-3 py-4 align-bottom">
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(stub.id)}
                              className="rounded-full border border-[var(--relic-border-muted)] px-3 py-1 text-xs text-[var(--relic-text-muted)] hover:border-[var(--relic-error-border)] hover:text-[var(--relic-error-text)]"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {t('compare.removeColumn')}
                            </button>
                          </div>
                          <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl bg-black ring-1 ring-[var(--relic-border-muted)]">
                            {r ? (
                              <ImageWithFallback src={r.image_url} alt={r.name || ''} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--relic-text-muted)]">
                                {t('compare.failedLoad')}
                              </div>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rowDefs.map((def) => {
                  const cells = cols.map((r) => def.get(r));
                  const highlightValues =
                    def.key === 'description'
                      ? cols.map((r) => relicDescriptionPlainText(r?.description?.trim() || ''))
                      : cells;
                  const highlight = rowHighlight(highlightValues);
                  const rowBg = highlight
                    ? 'bg-[color-mix(in_srgb,var(--relic-accent-muted-bg)_55%,transparent)]'
                    : 'bg-[color-mix(in_srgb,var(--relic-panel-bg-soft)_40%,transparent)]';
                  const cellText = highlight ? 'text-[var(--relic-text)]' : 'text-[var(--relic-text-muted)]';

                  return (
                    <tr key={def.key} className={`border-b border-[var(--relic-border-muted)] ${rowBg}`}>
                      <th
                        scope="row"
                        className={`sticky left-0 z-[1] whitespace-normal px-2 py-3 text-xs font-medium uppercase tracking-wide sm:whitespace-nowrap sm:px-3 ${highlight ? 'text-[var(--relic-accent-deep)] dark:text-[var(--relic-accent-bright)]' : 'text-[var(--relic-text-subtle)]'} bg-[var(--relic-panel-solid)]`}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {def.label}
                      </th>
                      {cells.map((raw, ci) => (
                        <td
                          key={`${def.key}-${selected[ci]?.id ?? ci}`}
                          className={`max-w-[240px] px-2 py-3 align-top text-sm sm:max-w-[280px] sm:px-3 ${cellText} ${def.key === 'description' ? 'break-words' : 'break-words'}`}
                          style={
                            def.key === 'description'
                              ? undefined
                              : { fontFamily: def.key === 'name' ? "'Playfair Display', serif" : "'Inter', sans-serif" }
                          }
                        >
                          {def.key === 'description' && raw.trim() ? (
                            sanitizeRelicHtml(raw).trim() ? (
                              <SafeHtmlDescription
                                html={raw}
                                className={`[&_a]:text-[var(--relic-accent-bright)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--relic-border-accent)] [&_blockquote]:pl-3 [&_em]:italic [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold ${cellText}`}
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              />
                            ) : (
                              missing
                            )
                          ) : raw.trim() ? (
                            <span style={{ fontFamily: def.key === 'name' ? "'Playfair Display', serif" : "'Inter', sans-serif" }}>
                              {raw}
                            </span>
                          ) : (
                            missing
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
