import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const categories = [
  {
    key: 'ceramics',
    title: 'Ceramics & Porcelain',
    description: 'Tang Sancai, Ming blue-and-white, Song celadon, and Qing famille-rose wares spanning over a millennium of ceramic mastery.',
    icon: '🏺',
    query: '?material=Ceramic',
  },
  {
    key: 'jade',
    title: 'Jade Artifacts',
    description: 'Ritual bi discs, cong tubes, pendants, and ornamental carvings from the Neolithic Liangzhu through Qing dynasty.',
    icon: '💎',
    query: '?search=jade',
  },
  {
    key: 'bronze',
    title: 'Bronze Vessels',
    description: 'Ritual bronzes from Shang and Zhou dynasties, including ding tripods, gui bowls, and intricately cast hu wine vessels.',
    icon: '🔔',
    query: '?search=bronze',
  },
  {
    key: 'painting',
    title: 'Paintings & Scrolls',
    description: 'Ink wash landscapes, figure paintings, and handscrolls by masters from the Tang through Qing dynasties.',
    icon: '🖌️',
    query: '?search=painting',
  },
  {
    key: 'calligraphy',
    title: 'Calligraphy',
    description: 'Running script, clerical script, and seal script masterpieces tracing the evolution of Chinese writing as an art form.',
    icon: '✒️',
    query: '?search=calligraphy',
  },
  {
    key: 'textiles',
    title: 'Textiles & Silk',
    description: 'Imperial robes, embroidered panels, kesi tapestry weaving, and silk artifacts from the Silk Road trade routes.',
    icon: '🧵',
    query: '?material=Silk',
  },
  {
    key: 'sculpture',
    title: 'Buddhist Sculpture',
    description: 'Stone and gilt-bronze Buddhist figures from the Northern Wei through Tang dynasties, housed in overseas museums.',
    icon: '🗿',
    query: '?search=buddhist',
  },
  {
    key: 'lacquer',
    title: 'Lacquerware',
    description: 'Carved cinnabar, mother-of-pearl inlay, and gold-painted lacquer pieces spanning Warring States to Qing periods.',
    icon: '🪷',
    query: '?search=lacquer',
  },
];

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const cardStyle = {
  background: 'var(--relic-card-grid)',
  border: '1px solid var(--relic-card-grid-border)',
} as const;

export default function CollectionsPage() {
  const { t } = useTranslation();

  return (
    <div className="pt-24 sm:pt-28 pb-16 sm:pb-24 px-3 sm:px-4 md:px-8 xl:px-10 max-w-[1400px] w-full min-w-0 mx-auto bg-[var(--relic-page)] min-h-screen transition-colors">
      <header className="mb-10">
        <h1
          className="mb-2"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 700,
            color: 'var(--relic-text)',
          }}
        >
          Collections
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Explore curated collections of overseas Chinese cultural relics organized by material, type, and historical period.
        </p>
      </header>

      <div className="grid min-w-0 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          >
            <Link
              to={`/catalog${cat.query}`}
              className="block rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 no-underline h-full"
              style={cardStyle}
            >
              <div className="p-5 sm:p-6">
                <span className="text-3xl mb-3 block" role="img" aria-hidden>
                  {cat.icon}
                </span>
                <h3
                  className="mb-2 text-lg"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    color: 'var(--relic-text)',
                  }}
                >
                  {cat.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-text-muted)',
                  }}
                >
                  {cat.description}
                </p>
                <span
                  className="inline-block mt-3 text-xs font-medium tracking-wide uppercase"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-accent-bright)',
                  }}
                >
                  Browse collection →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="mt-14 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <h2
          className="mb-4 text-xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: 'var(--relic-text)',
          }}
        >
          Browse by Dynasty
        </h2>
        <p
          className="mb-6"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.05rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Filter the catalog by major Chinese dynastic periods.
        </p>
        <div className="flex flex-wrap gap-3">
          {['Tang', 'Song', 'Yuan', 'Ming', 'Qing', 'Han', 'Zhou', 'Shang'].map((dynasty) => (
            <Link
              key={dynasty}
              to={`/catalog?dynasty=${encodeURIComponent(dynasty)}`}
              className="inline-block rounded-full px-4 py-2 text-sm font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-ghost-btn-text)',
                border: '1px solid var(--relic-border-accent)',
              }}
            >
              {dynasty}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <h2
          className="mb-4 text-xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: 'var(--relic-text)',
          }}
        >
          Browse by Museum
        </h2>
        <p
          className="mb-6"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.05rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Explore artifacts held by major museums worldwide.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'The Met', query: 'Metropolitan' },
            { label: 'Cleveland Museum', query: 'Cleveland' },
            { label: 'V&A Museum', query: 'Victoria' },
            { label: 'Art Institute of Chicago', query: 'Chicago' },
          ].map((museum) => (
            <Link
              key={museum.label}
              to={`/catalog?museum=${encodeURIComponent(museum.query)}`}
              className="inline-block rounded-full px-4 py-2 text-sm font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-ghost-btn-text)',
                border: '1px solid var(--relic-border-accent)',
              }}
            >
              {museum.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}