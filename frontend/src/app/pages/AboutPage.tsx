import { motion } from 'motion/react';
import { BookOpen, Globe, Shield, Users } from 'lucide-react';

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const cardStyle = {
  background: 'var(--relic-card-grid)',
  border: '1px solid var(--relic-card-grid-border)',
} as const;

const team = [
  {
    name: 'Dr. Li Wei',
    role: 'Lead Researcher & Curator',
    bio: 'Specialist in Tang and Song dynasty ceramics with 20 years of museum curation experience across Asia and Europe.',
  },
  {
    name: 'Prof. Sarah Mitchell',
    role: 'Digital Heritage Director',
    bio: 'Computational archaeologist focused on 3D digitization and metadata standards for cultural heritage preservation.',
  },
  {
    name: 'Chen Ming',
    role: 'Senior Data Engineer',
    bio: 'Builds the knowledge graph pipeline connecting relic metadata across 87+ museum collections worldwide.',
  },
  {
    name: 'Dr. Amara Osei',
    role: 'Research Partnerships Lead',
    bio: 'Coordinates collaborations with museums and academic institutions across Africa, Europe, and the Americas.',
  },
];

export default function AboutPage() {
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
          About Us
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Our mission is to preserve, document, and share the knowledge of overseas Chinese cultural relics for researchers, institutions, and the public worldwide.
        </p>
      </header>

      <section className="mb-12 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--relic-accent-muted-bg)' }}
          >
            <BookOpen size={20} style={{ color: 'var(--relic-accent-bright)' }} />
          </div>
          <h2
            className="text-xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Our Mission
          </h2>
        </div>
        <p
          className="text-sm leading-relaxed max-w-3xl"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: 'var(--relic-text-muted)',
          }}
        >
          Millions of Chinese cultural relics are held in museums and private collections outside China.
          The Overseas Relic Knowledge platform was founded to create a unified, searchable, and open-access
          digital archive of these artifacts. By aggregating metadata from museum APIs, scholarly publications,
          and institutional databases, we enable researchers, historians, and the public to explore, compare,
          and study relics that would otherwise remain siloed across hundreds of separate collections.
        </p>
      </section>

      <section className="mb-12 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--relic-accent-muted-bg)' }}
          >
            <Globe size={20} style={{ color: 'var(--relic-accent-bright)' }} />
          </div>
          <h2
            className="text-xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Project Background
          </h2>
        </div>
        <p
          className="text-sm leading-relaxed max-w-3xl"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: 'var(--relic-text-muted)',
          }}
        >
          The project began as a research initiative in 2020 to map and catalog Chinese cultural heritage
          held in overseas institutions. Using open-access museum APIs, Neo4j graph database technology,
          and AI-assisted natural language search, the platform has grown to index thousands of relics
          spanning the Shang dynasty through the Qing. The catalog includes ceramics, jade, bronzes,
          paintings, calligraphy, textiles, lacquerware, and Buddhist sculpture from museums across
          87 countries.
        </p>
      </section>

      <section className="mb-12 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--relic-accent-muted-bg)' }}
          >
            <Users size={20} style={{ color: 'var(--relic-accent-bright)' }} />
          </div>
          <h2
            className="text-xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Our Team
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl p-5"
              style={cardStyle}
            >
              <h3
                className="mb-1 text-base"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  color: 'var(--relic-text)',
                }}
              >
                {member.name}
              </h3>
              <p
                className="mb-2 text-xs font-medium tracking-wide uppercase"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-accent-bright)',
                }}
              >
                {member.role}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-text-muted)',
                }}
              >
                {member.bio}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--relic-accent-muted-bg)' }}
          >
            <Shield size={20} style={{ color: 'var(--relic-accent-bright)' }} />
          </div>
          <h2
            className="text-xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Our Values
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div>
            <h3
              className="mb-1 font-semibold"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
            >
              Open Access
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}>
              All catalog data, statistics, and documentation are freely accessible. We believe cultural
              heritage knowledge should never be behind a paywall.
            </p>
          </div>
          <div>
            <h3
              className="mb-1 font-semibold"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
            >
              Scholarly Rigor
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}>
              Metadata is sourced from verified museum catalogs. Dynasty and material labels are
              canonicalized through server-side parsing pipelines.
            </p>
          </div>
          <div>
            <h3
              className="mb-1 font-semibold"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
            >
              Global Collaboration
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}>
              We partner with museums, universities, and cultural institutions across 87 countries
              to ensure broad and accurate coverage.
            </p>
          </div>
          <div>
            <h3
              className="mb-1 font-semibold"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
            >
              Technical Transparency
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}>
              Our data pipeline, parsing algorithms, and API endpoints are fully documented. Researchers
              can verify how every piece of metadata was derived.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}