import { motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StatProps {
  end: number;
  suffix: string;
  label: string;
  delay: number;
}

function AnimatedStat({ end, suffix, label, delay }: StatProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const { i18n } = useTranslation();

  const locale = i18n.language.startsWith('zh') ? 'zh-CN' : i18n.language.startsWith('az') ? 'az-AZ' : undefined;

  useEffect(() => {
    if (!isInView || end <= 0) return undefined;
    const duration = 2000;
    const increment = end / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, end]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="text-center"
    >
      <div
        className="mb-4"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(3rem, 6vw, 5rem)',
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-gold-mid) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        {count.toLocaleString(locale)}
        {suffix}
      </div>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '1rem',
          color: 'var(--relic-text-muted)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </motion.div>
  );
}

type StatsShape = {
  total_relics: number;
  total_museums: number;
  total_dynasties: number;
  total_materials: number;
};

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function StatisticsSection() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsShape | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch('/stats', { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || typeof data !== 'object') return;
        const d = data as Record<string, unknown>;
        setStats({
          total_relics: Math.max(0, Math.round(num(d.total_relics))),
          total_museums: Math.max(0, Math.round(num(d.total_museums))),
          total_dynasties: Math.max(0, Math.round(num(d.total_dynasties))),
          total_materials: Math.max(0, Math.round(num(d.total_materials))),
        });
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const rows: StatProps[] = stats
    ? [
        { end: stats.total_relics, suffix: '', label: t('landing.statistics.archivedRelics'), delay: 0 },
        { end: stats.total_museums, suffix: '', label: t('landing.statistics.museumsRepresented'), delay: 0.15 },
        { end: stats.total_dynasties, suffix: '', label: t('landing.statistics.dynastyFacets'), delay: 0.3 },
        { end: stats.total_materials, suffix: '', label: t('landing.statistics.materialTypes'), delay: 0.45 },
      ]
    : [
        { end: 0, suffix: '', label: t('landing.statistics.archivedRelics'), delay: 0 },
        { end: 0, suffix: '', label: t('landing.statistics.museumsRepresented'), delay: 0.15 },
        { end: 0, suffix: '', label: t('landing.statistics.dynastyFacets'), delay: 0.3 },
        { end: 0, suffix: '', label: t('landing.statistics.materialTypes'), delay: 0.45 },
      ];

  return (
    <section className="py-20 sm:py-28 lg:py-32 px-4 sm:px-6 md:px-10 lg:px-12 relative overflow-x-hidden bg-[var(--relic-page)] transition-colors">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--relic-accent-bright) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-[1600px] mx-auto relative z-10 w-full min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
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
            {t('landing.statistics.headline')}
          </h2>
          <p
            className="max-w-2xl mx-auto"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.25rem',
              color: 'var(--relic-text-muted)',
              lineHeight: 1.8,
            }}
          >
            {t('landing.statistics.subhead')}
          </p>
        </motion.div>

        {!stats ? (
          <p className="text-center text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t('landing.statistics.loading')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:gap-10 lg:grid-cols-4 lg:gap-8">
            {rows.map((stat) => (
              <AnimatedStat key={`${stat.label}-${stat.end}`} {...stat} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
