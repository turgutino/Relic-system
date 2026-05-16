import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { useCompareSelection } from '@/app/context/CompareSelectionContext';

export function CompareStickyBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selected, removeId, clear, slotsRemaining, canCompare } = useCompareSelection();

  if (selected.length === 0) return null;

  const needMore = Math.max(0, 2 - selected.length);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[var(--relic-border)] bg-[color-mix(in_srgb,var(--relic-panel-solid)_94%,transparent)] px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors dark:shadow-[0_-8px_32px_rgba(0,0,0,0.45)]"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <p className="shrink-0 text-xs text-[var(--relic-text-muted)] sm:max-w-[200px]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {needMore > 0
              ? t('compare.stickyPickMore', { count: needMore })
              : slotsRemaining > 0
                ? t('compare.stickyOptionalMore', { count: slotsRemaining })
                : t('compare.stickyFull')}
          </p>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selected.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => removeId(s.id)}
                className="group relative shrink-0 rounded-xl ring-1 ring-[var(--relic-border-muted)] transition hover:ring-[var(--relic-accent-bright)]"
                title={t('compare.removeFromBar')}
                aria-label={t('compare.removeFromBarNamed', { name: s.name || s.id })}
              >
                <span className="block size-14 overflow-hidden rounded-xl sm:size-16">
                  <ImageWithFallback src={s.image_url} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-4 py-2 text-xs text-[var(--relic-text-muted)] underline-offset-2 hover:underline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t('compare.clearAll')}
          </button>
          <button
            type="button"
            disabled={!canCompare}
            onClick={() => navigate('/compare')}
            className="rounded-full px-6 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: canCompare
                ? 'linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)'
                : 'var(--relic-border-muted)',
              color: canCompare ? 'var(--relic-btn-primary-fg)' : 'var(--relic-text-muted)',
            }}
          >
            {t('compare.compareNow')}
          </button>
        </div>
      </div>
    </div>
  );
}
