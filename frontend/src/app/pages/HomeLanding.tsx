import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/context/AuthContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { normalizeRelic } from '@/models/relic';
import type { Relic } from '@/models/relic';
import { HeroSection } from '@/app/components/HeroSection';
import { StatisticsSection } from '@/app/components/StatisticsSection';
import { StorytellingSection } from '@/app/components/StorytellingSection';
import { Footer } from '@/app/components/Footer';

function RelicCardCompact({
  relic,
}: {
  relic: Relic;
}) {
  return (
    <Link
      to={`/relics/${encodeURIComponent(relic.id)}`}
      className="block w-full rounded-[1.35rem] sm:rounded-3xl outline-none ring-offset-4 ring-offset-[var(--relic-page)] focus-visible:ring-2 focus-visible:ring-[var(--relic-accent-bright)]"
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
              {relic.material || relic.classification || 'Relic'}
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
            {relic.name || 'Untitled Relic'}
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
                {relic.museum || '\u2014'}
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
                {[relic.dynasty, relic.date].filter(Boolean).join(' \u00b7 ') || '\u2014'}
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

function SkeletonCard() {
  return (
    <div className="w-full rounded-[1.35rem] sm:rounded-3xl overflow-hidden"
      style={{
        background: 'var(--relic-card-grid)',
        border: '1px solid var(--relic-card-grid-border)',
      }}
    >
      <div className="h-[clamp(8.5rem,22vw,13.5rem)] animate-pulse" style={{ background: 'var(--relic-border)' }} />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="h-5 w-3/4 rounded animate-pulse" style={{ background: 'var(--relic-border)' }} />
        <div className="h-3.5 w-full rounded animate-pulse" style={{ background: 'var(--relic-border)' }} />
        <div className="h-3.5 w-2/3 rounded animate-pulse" style={{ background: 'var(--relic-border)' }} />
      </div>
    </div>
  );
}

function RecommendedSection() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [relics, setRelics] = useState<Relic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(false);

    fetch('/recommendations', {
      signal: ac.signal,
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('bad status');
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRelics(list.map(normalizeRelic).filter(Boolean) as Relic[]);
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setError(true);
          setRelics([]);
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) return null;
  if (!loading && !error && relics.length === 0) return null;
  if (error) return null;

  return (
    <section className="relative min-w-0 overflow-x-clip bg-[var(--relic-page)] py-14 transition-colors sm:py-20 lg:py-28">
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
            {t('landing.recommended.title', 'Recommended for You')}
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
            {t('landing.recommended.subtitle', 'Based on your browsing history and favorites')}
          </p>
        </motion.div>
      </div>

      {loading ? (
        <div className="relative z-10 mx-auto w-full max-w-[116rem] min-w-0 px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto w-full max-w-[116rem] min-w-0 px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {relics.map((relic) => (
              <RelicCardCompact key={relic.id} relic={relic} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function HomeLanding() {
  return (
    <>
      <HeroSection />
      <StatisticsSection />
      <RecommendedSection />
      <StorytellingSection />
      <Footer />
    </>
  );
}