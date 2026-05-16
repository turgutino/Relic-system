import { motion } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { cn } from '@/app/components/ui/utils';
import type { Relic } from '@/models/relic';
import { normalizeRelic } from '@/models/relic';

function FeaturedCardStride(el: HTMLElement | null): number {
  if (!el) return 0;
  const card = el.querySelector<HTMLElement>('[data-featured-card]');
  if (!card) return 0;
  const styles = getComputedStyle(el);
  const gapRaw = styles.columnGap || styles.gap || '0';
  const gap = Number.parseFloat(gapRaw) || 0;
  return card.getBoundingClientRect().width + gap;
}

function RelicCard({
  relic,
  defaultBadge,
  untitled,
}: {
  relic: Relic;
  defaultBadge: string;
  untitled: string;
}) {
  return (
    <Link
      data-featured-card
      to={`/relics/${encodeURIComponent(relic.id)}`}
      className="block shrink-0 w-[min(380px,82dvw)] max-w-[380px] rounded-3xl outline-none ring-offset-4 ring-offset-[var(--relic-page)] focus-visible:ring-2 focus-visible:ring-[var(--relic-accent-bright)] sm:w-[380px] sm:max-w-[380px]"
    >
      <motion.div
        whileHover={{ y: -12 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="group relative h-full rounded-3xl overflow-hidden cursor-pointer"
        style={{
          background: 'var(--relic-card-grid)',
          border: '1px solid var(--relic-card-grid-border)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="relative h-[220px] sm:h-[260px] lg:h-[280px] overflow-hidden">
          <ImageWithFallback
            src={relic.image_url}
            alt={relic.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(var(--relic-page-rgb), 0.88) 100%)',
            }}
          />
          <div
            className="absolute top-4 right-4 px-4 py-1.5 rounded-full"
            style={{
              background: 'var(--relic-accent-muted-bg)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--relic-border-accent)',
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.75rem',
                color: 'var(--relic-accent-bright)',
                letterSpacing: '0.05em',
              }}
            >
              {relic.material || relic.classification || defaultBadge}
            </span>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--relic-accent-bright)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <ExternalLink size={18} style={{ color: 'var(--relic-btn-primary-fg)' }} />
          </motion.div>
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          <h3
            className="mb-4 line-clamp-2 [overflow-wrap:anywhere]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.15rem, 3.5vw, 1.5rem)',
              fontWeight: 600,
              color: 'var(--relic-text)',
              lineHeight: 1.3,
            }}
          >
            {relic.name || untitled}
          </h3>

          <div className="space-y-2">
            <div className="flex min-w-0 items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--relic-accent-bright)' }} />
              <span
                className="min-w-0 line-clamp-2 [overflow-wrap:anywhere]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9rem',
                  color: 'var(--relic-text-muted)',
                }}
              >
                {relic.museum || '—'}
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <Calendar size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--relic-accent-bright)' }} />
              <span
                className="min-w-0 line-clamp-2 [overflow-wrap:anywhere]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9rem',
                  color: 'var(--relic-text-muted)',
                }}
              >
                {[relic.dynasty, relic.date].filter(Boolean).join(' · ') || '—'}
              </span>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--relic-accent-bright), transparent)',
          }}
        />
      </motion.div>
    </Link>
  );
}

export function FeaturedRelics() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [relics, setRelics] = useState<Relic[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const syncArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const tol = 6;
    setCanPrev(el.scrollLeft > tol);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - tol);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncArrows();
  }, [relics.length, loading, fetchError, syncArrows]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    window.addEventListener('resize', syncArrows);
    return () => {
      el.removeEventListener('scroll', syncArrows);
      window.removeEventListener('resize', syncArrows);
      ro.disconnect();
    };
  }, [relics.length, loading, fetchError, syncArrows]);

  const scrollByOne = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const stride = FeaturedCardStride(el);
    if (stride <= 0) return;
    el.scrollBy({ left: direction * stride, behavior: 'smooth' });
    window.requestAnimationFrame(() => {
      window.setTimeout(syncArrows, 320);
    });
  }, [syncArrows]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setFetchError(false);
    fetch('/relics?page=1&limit=6&sort=name&order=asc', { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error('bad status');
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data.items) ? data.items : [];
        setRelics(list.map(normalizeRelic).filter(Boolean) as Relic[]);
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setFetchError(true);
          setRelics([]);
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, []);

  const defaultBadge = t('landing.featured.defaultBadge');
  const untitled = t('catalogPage.untitled');

  const arrowClass = cn(
    'absolute top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-opacity duration-200',
    'border backdrop-blur-md',
    'bg-[var(--relic-card-grid)] text-[var(--relic-text)]',
    'border-[var(--relic-card-grid-border)]',
    'hover:bg-[var(--relic-accent-muted-bg)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--relic-accent-bright)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--relic-page)]',
    'opacity-100',
    'md:opacity-0 md:pointer-events-none',
    'md:group-hover/featured:opacity-100 md:group-hover/featured:pointer-events-auto',
    'md:group-focus-within/featured:opacity-100 md:group-focus-within/featured:pointer-events-auto',
    'disabled:pointer-events-none disabled:opacity-30 disabled:hover:bg-[var(--relic-card-grid)]',
  );

  return (
    <section id="collections" className="py-20 sm:py-28 lg:py-32 relative bg-[var(--relic-page)] transition-colors min-w-0">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-10 lg:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2
            className="mb-6"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 700,
              color: 'var(--relic-text)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('landing.featured.title')}
          </h2>
          <p
            className="max-w-2xl"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.25rem',
              color: 'var(--relic-text-muted)',
              lineHeight: 1.8,
            }}
          >
            {t('landing.featured.subtitle')}
          </p>
        </motion.div>
      </div>

      {loading ? (
        <p className="px-4 sm:px-6 lg:px-12 text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t('landing.featured.loading')}
        </p>
      ) : null}
      {fetchError ? (
        <p className="px-4 sm:px-6 lg:px-12 text-[var(--relic-error-text)] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t('landing.featured.error', { host: '127.0.0.1:8000' })}
        </p>
      ) : null}

      {!loading && !fetchError ? (
        <div className="group/featured relative z-10 min-w-0 max-w-[100vw]">
          {relics.length > 0 ? (
            <>
              <button
                type="button"
                aria-label={t('landing.featured.scrollPrev')}
                disabled={!canPrev}
                onClick={() => scrollByOne(-1)}
                className={cn(arrowClass, 'left-[max(0.5rem,env(safe-area-inset-left,0px))] sm:left-4 lg:left-10')}
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={t('landing.featured.scrollNext')}
                disabled={!canNext}
                onClick={() => scrollByOne(1)}
                className={cn(arrowClass, 'right-[max(0.5rem,env(safe-area-inset-right,0px))] sm:right-4 lg:right-10')}
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          ) : null}

          <div
            ref={scrollRef}
            className={cn(
              'flex gap-4 overflow-x-auto scroll-smooth overscroll-x-contain sm:gap-6',
              'touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              'pb-8',
              'ps-[max(1rem,env(safe-area-inset-left,0px))] pe-[max(1rem,env(safe-area-inset-right,0px))]',
              'sm:ps-6 sm:pe-6 lg:ps-12 lg:pe-12',
            )}
          >
            {relics.length === 0 ? (
              <p className="text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('landing.featured.empty')}
              </p>
            ) : (
              relics.map((relic) => (
                <RelicCard key={relic.id} relic={relic} defaultBadge={defaultBadge} untitled={untitled} />
              ))
            )}
          </div>
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute top-0 right-0 bottom-0 z-[5] w-16 sm:w-24 md:w-32"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--relic-page))',
        }}
      />
    </section>
  );
}
