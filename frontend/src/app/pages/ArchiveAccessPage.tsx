import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Filter, BookOpen, Download, ShieldCheck, Globe } from 'lucide-react';

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const cardStyle = {
  background: 'var(--relic-card-grid)',
  border: '1px solid var(--relic-card-grid-border)',
} as const;

const features = [
  {
    key: 'search',
    title: 'Full-Text Search',
    description: 'Search across relic names, museums, dynasties, materials, artists, and descriptions with case-insensitive matching and relevance ranking.',
    icon: Search,
  },
  {
    key: 'filter',
    title: 'Faceted Filtering',
    description: 'Narrow results by dynasty, material type, or museum. Filters are computed server-side from the active result set for accurate counts.',
    icon: Filter,
  },
  {
    key: 'browse',
    title: 'Curated Categories',
    description: 'Browse pre-organized collections by category — Ceramics, Jade, Bronze, Paintings, Textiles — each linked to relevant catalog searches.',
    icon: BookOpen,
  },
  {
    key: 'export',
    title: 'Data Export',
    description: 'Export search results and filtered views in CSV, Excel (XLSX), or JSON format for offline research and analysis.',
    icon: Download,
  },
  {
    key: 'access',
    title: 'Open Access',
    description: 'All relic metadata and catalog data is freely accessible. No login required for browsing, searching, or viewing relic details.',
    icon: Globe,
  },
  {
    key: 'quality',
    title: 'Verified Metadata',
    description: 'Description fields are sanitized for safe rendering. Dynasty and material labels are canonicalized through server-side parsing pipelines.',
    icon: ShieldCheck,
  },
];

export default function ArchiveAccessPage() {
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
          Archive Access
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Browse and access preserved archive materials and records of overseas Chinese cultural relics from museums worldwide.
        </p>
      </header>

      <div className="grid min-w-0 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 mb-14">
        {features.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="flex flex-col rounded-2xl p-5 sm:p-6"
            style={cardStyle}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'var(--relic-accent-muted-bg)' }}
            >
              <f.icon size={20} style={{ color: 'var(--relic-accent-bright)' }} />
            </div>
            <h3
              className="mb-2 text-lg"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                color: 'var(--relic-text)',
              }}
            >
              {f.title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>

      <section className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <h2
          className="mb-4 text-xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: 'var(--relic-text)',
          }}
        >
          How to Access the Archive
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div>
            <h3
              className="mb-2 text-base font-semibold"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text)',
              }}
            >
              Via the Catalog
            </h3>
            <p
              className="text-sm leading-relaxed mb-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              The catalog page provides the primary entry point for browsing and searching the archive.
              Use facet filters, text search, or the AI-powered natural language query interface.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-ghost-btn-text)',
                border: '1px solid var(--relic-border-accent)',
              }}
            >
              Open Catalog →
            </Link>
          </div>
          <div>
            <h3
              className="mb-2 text-base font-semibold"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text)',
              }}
            >
              Via Collections
            </h3>
            <p
              className="text-sm leading-relaxed mb-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              Browse curated categories organized by material type — Ceramics, Jade, Bronze, Paintings, and more.
              Each category links to a pre-filtered catalog view for quick exploration.
            </p>
            <Link
              to="/collections"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-ghost-btn-text)',
                border: '1px solid var(--relic-border-accent)',
              }}
            >
              Browse Collections →
            </Link>
          </div>
          <div>
            <h3
              className="mb-2 text-base font-semibold"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text)',
              }}
            >
              Via the API
            </h3>
            <p
              className="text-sm leading-relaxed mb-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              All archive data is accessible programmatically through the REST API. Endpoints support pagination,
              filtering, sorting, and export in multiple formats (CSV, XLSX, JSON).
            </p>
            <Link
              to="/documentation"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-ghost-btn-text)',
                border: '1px solid var(--relic-border-accent)',
              }}
            >
              View Documentation →
            </Link>
          </div>
          <div>
            <h3
              className="mb-2 text-base font-semibold"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text)',
              }}
            >
              Via Research Tools
            </h3>
            <p
              className="text-sm leading-relaxed mb-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              Use specialized tools including the AI search, historical timeline, museum map, side-by-side comparison,
              and knowledge graph for in-depth research and analysis.
            </p>
            <Link
              to="/research-tools"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-ghost-btn-text)',
                border: '1px solid var(--relic-border-accent)',
              }}
            >
              Open Research Tools →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}