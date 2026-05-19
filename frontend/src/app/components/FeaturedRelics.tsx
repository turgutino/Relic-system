import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Relic } from '@/models/relic';
import { normalizeRelic } from '@/models/relic';

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
      className="block min-w-0 w-full rounded-[1.35rem] sm:rounded-3xl outline-none ring-offset-4 ring-offset-[var(--relic-page)] focus-visible:ring-2 focus-visible:ring-[var(--relic-accent-bright)]"
    >
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="group relative h-full rounded-[1.35rem] sm:rounded-3xl overflow-hidden cursor-pointer"
        style={{
          background: 'var(--relic-card-grid)',
          border: '1px solid var(--relic-card-grid-border)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="relative h-[clamp(8.5rem,22vw,13.5rem)] overflow-hidden">
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
            className="absolute right-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full px-3 py-1 sm:right-4 sm:top-4 sm:px-4 sm:py-1.5"
            style={{
              background: 'var(--relic-accent-muted-bg)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--relic-border-accent)',
            }}
          >
            <span
              className="block truncate"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(0.62rem, 1.6vw, 0.75rem)',
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
            className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full sm:size-12"
            style={{
              background: 'var(--relic-accent-bright)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <ExternalLink size={18} style={{ color: 'var(--relic-btn-primary-fg)' }} />
          </motion.div>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <h3
            className="mb-3 line-clamp-2 [overflow-wrap:anywhere] sm:mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(0.95rem, 1.55vw, 1.22rem)',
              fontWeight: 600,
              color: 'var(--relic-text)',
              lineHeight: 1.28,
            }}
          >
            {relic.name || untitled}
          </h3>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex min-w-0 items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--relic-accent-bright)' }} />
              <span
                className="min-w-0 line-clamp-2 [overflow-wrap:anywhere]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(0.72rem, 1.45vw, 0.86rem)',
                  color: 'var(--relic-text-muted)',
                }}
              >
                {relic.museum || '—'}
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <Calendar size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--relic-accent-bright)' }} />
              <span
                className="min-w-0 line-clamp-2 [overflow-wrap:anywhere]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(0.72rem, 1.45vw, 0.86rem)',
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
  const [relics, setRelics] = useState<Relic[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

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

  return (
    <section id="collections" className="landing-featured-section relative min-w-0 overflow-x-clip bg-[var(--relic-page)] py-14 transition-colors sm:py-20 lg:py-28">
      <div className="mx-auto mb-9 max-w-5xl px-4 text-center sm:px-6 lg:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2
            className="mb-4 text-balance sm:mb-6"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.65rem, 5vw, 3.4rem)',
              fontWeight: 700,
              color: 'var(--relic-text)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('landing.featured.title')}
          </h2>
          <p
            className="mx-auto max-w-2xl text-balance"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(0.95rem, 2.5vw, 1.18rem)',
              color: 'var(--relic-text-muted)',
              lineHeight: 1.7,
            }}
          >
            {t('landing.featured.subtitle')}
          </p>
        </motion.div>
      </div>

      {loading ? (
        <p className="mx-auto max-w-5xl px-4 text-center text-[var(--relic-text-muted)] sm:px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t('landing.featured.loading')}
        </p>
      ) : null}
      {fetchError ? (
        <p className="mx-auto max-w-5xl px-4 text-center text-sm text-[var(--relic-error-text)] sm:px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t('landing.featured.error', { host: '127.0.0.1:8000' })}
        </p>
      ) : null}

      {!loading && !fetchError ? (
        <div className="landing-featured-shell relative z-10 mx-auto w-full max-w-[116rem] min-w-0 px-4 sm:px-6 lg:px-10">
          {relics.length === 0 ? (
            <p className="text-center text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('landing.featured.empty')}
            </p>
          ) : (
            <div
              data-featured-card-row
              className="landing-featured-grid grid min-w-0 justify-center gap-4 sm:gap-5 lg:gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,12.5rem),15.25rem))] min-[1600px]:[grid-template-columns:repeat(auto-fit,minmax(13rem,16rem))]"
            >
              {relics.map((relic) => (
                <RelicCard key={relic.id} relic={relic} defaultBadge={defaultBadge} untitled={untitled} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div
        className="hidden"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--relic-page))',
        }}
      />
    </section>
  );
}
