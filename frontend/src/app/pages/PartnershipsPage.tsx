import { motion } from 'motion/react';
import { Building2, Handshake, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const cardStyle = {
  background: 'var(--relic-card-grid)',
  border: '1px solid var(--relic-card-grid-border)',
} as const;

const partners = [
  {
    name: 'Cleveland Museum of Art',
    location: 'Cleveland, Ohio, USA',
    description: 'Home to one of the most comprehensive collections of Chinese art in North America, spanning Neolithic jades through Qing dynasty paintings. The museum\'s open-access API provides detailed metadata for over 1,000 Chinese artifacts.',
    highlights: 'Notable for Song dynasty paintings and early Chinese bronzes',
    query: 'Cleveland',
  },
  {
    name: 'Metropolitan Museum of Art',
    location: 'New York, NY, USA',
    description: 'The Met\'s Asian Art collection includes over 35,000 objects representing 5,000 years of Asian art. The Chinese collection features masterpieces in every medium, from ancient ritual bronzes to contemporary ink paintings.',
    highlights: 'Renowned for Tang dynasty ceramics and Ming furniture',
    query: 'Metropolitan',
  },
  {
    name: 'Victoria and Albert Museum',
    location: 'London, United Kingdom',
    description: 'The V&A holds one of the most important collections of Chinese art in Europe, with particular strength in ceramics, textiles, and decorative arts from the Song through Qing dynasties.',
    highlights: 'Exceptional collection of Chinese export porcelain',
    query: 'Victoria',
  },
  {
    name: 'Art Institute of Chicago',
    location: 'Chicago, Illinois, USA',
    description: 'The Art Institute\'s Asian collection includes significant holdings of Chinese bronzes, ceramics, jades, and textiles. The museum has been a leader in digitizing and sharing collection data through open APIs.',
    highlights: 'Distinguished collection of archaic Chinese jades',
    query: 'Chicago',
  },
];

export default function PartnershipsPage() {
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
          Partnerships
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          We collaborate with leading museums and cultural institutions worldwide to aggregate, normalize, and share Chinese cultural heritage data.
        </p>
      </header>

      <section className="mb-10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--relic-accent-muted-bg)' }}
          >
            <Handshake size={20} style={{ color: 'var(--relic-accent-bright)' }} />
          </div>
          <h2
            className="text-xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            How We Collaborate
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'API Integration', desc: 'We consume museum open-access APIs to ingest relic metadata, images, and provenance data into our unified catalog.' },
            { label: 'Data Normalization', desc: 'Our parsing pipelines canonicalize inconsistent dynasty, material, and date labels across heterogeneous museum schemas.' },
            { label: 'Attribution & Linking', desc: 'Every relic in our catalog links back to its source museum, with proper attribution and object URLs for verification.' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4" style={cardStyle}>
              <h3
                className="mb-1 text-sm font-semibold"
                style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
              >
                {item.label}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <h2
        className="mb-6 text-xl"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 600,
          color: 'var(--relic-text)',
        }}
      >
        Museum Partners
      </h2>

      <div className="space-y-4">
        {partners.map((partner, i) => (
          <motion.div
            key={partner.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-2xl p-5 sm:p-6"
            style={cardStyle}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--relic-accent-muted-bg)' }}
              >
                <Building2 size={20} style={{ color: 'var(--relic-accent-bright)' }} />
              </div>
              <div>
                <h3
                  className="text-lg"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    color: 'var(--relic-text)',
                  }}
                >
                  {partner.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Globe size={12} style={{ color: 'var(--relic-text-subtle)' }} />
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--relic-text-subtle)',
                    }}
                  >
                    {partner.location}
                  </span>
                </div>
              </div>
            </div>
            <p
              className="mb-3 text-sm leading-relaxed"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              {partner.description}
            </p>
            <p
              className="mb-4 text-xs font-medium italic"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-accent-bright)',
              }}
            >
              {partner.highlights}
            </p>
            <Link
              to={`/catalog?museum=${encodeURIComponent(partner.query)}`}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-ghost-btn-text)',
                border: '1px solid var(--relic-border-accent)',
              }}
            >
              Explore {partner.name} Collection <ArrowRight size={12} />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}