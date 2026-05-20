import { motion } from 'motion/react';
import { Newspaper, Download, Image, Mail } from 'lucide-react';
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

const releases = [
  {
    date: '2026-04-15',
    title: 'Overseas Relic Knowledge Launches AI-Powered Natural Language Search',
    summary: 'The platform now supports plain-English queries that are parsed by GPT-4o-mini into structured catalog filters, making research accessible to non-specialists.',
  },
  {
    date: '2026-02-10',
    title: 'Catalog Reaches 5,000 Indexed Relics Across 87 Countries',
    summary: 'Milestone achievement: the platform now indexes over 5,000 Chinese cultural relics from museum collections worldwide, with Neo4j graph database integration.',
  },
  {
    date: '2025-11-20',
    title: 'Partnership Announced with Victoria and Albert Museum',
    summary: 'The V&A joins our museum partner network, contributing metadata for over 200 Chinese decorative arts objects to the unified catalog.',
  },
  {
    date: '2025-08-05',
    title: 'New Export Formats: CSV, Excel XLSX, and JSON',
    summary: 'Researchers can now export filtered catalog results in three formats. HTML markup is automatically stripped from export cells for clean data analysis.',
  },
];

export default function PressKitPage() {
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
          Press Kit
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Press releases, media assets, brand guidelines, and contact information for journalists and media inquiries.
        </p>
      </header>

      <section className="mb-10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <h2
          className="mb-2 text-xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: 'var(--relic-text)',
          }}
        >
          Press Releases
        </h2>
        <p
          className="mb-6 text-sm"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: 'var(--relic-text-muted)',
          }}
        >
          Latest announcements and updates from the Overseas Relic Knowledge platform.
        </p>
        <div className="space-y-4">
          {releases.map((release, i) => (
            <motion.div
              key={release.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl p-4 sm:p-5"
              style={cardStyle}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'var(--relic-accent-muted-bg)' }}
                >
                  <Newspaper size={16} style={{ color: 'var(--relic-accent-bright)' }} />
                </div>
                <div>
                  <p
                    className="mb-1 text-xs font-medium tracking-wide uppercase"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--relic-accent-bright)',
                    }}
                  >
                    {release.date}
                  </p>
                  <h3
                    className="mb-1 text-base"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 600,
                      color: 'var(--relic-text)',
                    }}
                  >
                    {release.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--relic-text-muted)',
                    }}
                  >
                    {release.summary}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        <section className="rounded-2xl sm:rounded-3xl p-6 sm:p-8" style={panel}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--relic-accent-muted-bg)' }}
            >
              <Image size={20} style={{ color: 'var(--relic-accent-bright)' }} />
            </div>
            <h2
              className="text-lg"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                color: 'var(--relic-text)',
              }}
            >
              Media Assets
            </h2>
          </div>
          <p
            className="mb-4 text-sm leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
          >
            Download our brand assets, logo variations, screenshots, and product images.
          </p>
          <a
            href="/press-kit"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-ghost-btn-text)',
              border: '1px solid var(--relic-border-accent)',
            }}
          >
            <Download size={14} />
            Download Press Package (ZIP)
          </a>
        </section>

        <section className="rounded-2xl sm:rounded-3xl p-6 sm:p-8" style={panel}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--relic-accent-muted-bg)' }}
            >
              <Mail size={20} style={{ color: 'var(--relic-accent-bright)' }} />
            </div>
            <h2
              className="text-lg"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                color: 'var(--relic-text)',
              }}
            >
              Press Contact
            </h2>
          </div>
          <p
            className="mb-4 text-sm leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
          >
            For interview requests, media inquiries, or additional information, reach out to our communications team.
          </p>
          <div
            className="space-y-2 text-sm"
            style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
          >
            <p>
              <strong style={{ color: 'var(--relic-text)' }}>Email:</strong>{' '}
              <span style={{ color: 'var(--relic-accent-bright)' }}>press@overseasrelic.org</span>
            </p>
            <p>
              <strong style={{ color: 'var(--relic-text)' }}>Phone:</strong>{' '}
              <span style={{ color: 'var(--relic-text-muted)' }}>+1 (555) 123-4568</span>
            </p>
            <p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)] mt-2"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-ghost-btn-text)',
                  border: '1px solid var(--relic-border-accent)',
                }}
              >
                Contact Form →
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}