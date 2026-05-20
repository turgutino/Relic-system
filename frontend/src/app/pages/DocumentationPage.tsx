import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileJson, FileSpreadsheet, FileText, Database, Code2, Globe } from 'lucide-react';

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const cardStyle = {
  background: 'var(--relic-card-grid)',
  border: '1px solid var(--relic-card-grid-border)',
} as const;

const endpoints = [
  {
    method: 'GET',
    path: '/relics',
    description: 'Paginated catalog with facet filters (dynasty, material, museum), text search, and sorting by name, dynasty, or date.',
    icon: FileText,
  },
  {
    method: 'GET',
    path: '/relics/{id}',
    description: 'Single relic detail with full metadata: name, dynasty, museum, material, description, image_url, artist, date, classification, and more.',
    icon: FileJson,
  },
  {
    method: 'GET',
    path: '/relics/{id}/related',
    description: 'Up to 5 related relics matching by dynasty or museum. Used on the relic detail page for discovery.',
    icon: FileJson,
  },
  {
    method: 'GET',
    path: '/relics/search/advanced',
    description: 'Advanced multi-field search: name, museum, dynasty, material, artist, classification, and date range.',
    icon: FileSpreadsheet,
  },
  {
    method: 'POST',
    path: '/relics/query/natural',
    description: 'AI-powered natural language search. Sends a plain-English query; GPT-4o-mini extracts structured filters, then searches the catalog.',
    icon: Code2,
  },
  {
    method: 'GET',
    path: '/relics/export',
    description: 'Export filtered catalog results as CSV, XLSX, or JSON. Respects active filters and search query. Up to 10,000 rows.',
    icon: FileSpreadsheet,
  },
  {
    method: 'GET',
    path: '/stats',
    description: 'Aggregated collection statistics: total relics, museums, dynasties, materials, plus top-15 breakdowns for charts.',
    icon: Database,
  },
  {
    method: 'GET',
    path: '/timeline',
    description: 'Century histogram — count of relics per century derived from date prefixes. Powers the interactive timeline chart.',
    icon: Database,
  },
  {
    method: 'GET',
    path: '/museums/geo',
    description: 'Geographic data for museum markers on the interactive map: name, lat/lng, country, city, and relic count.',
    icon: Globe,
  },
];

export default function DocumentationPage() {
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
          Documentation
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Technical and historical documentation of relic preservation. API reference, data sources, and methodology for the Overseas Relic Knowledge platform.
        </p>
      </header>

      <section className="mb-12 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <h2
          className="mb-2 text-xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: 'var(--relic-text)',
          }}
        >
          REST API Reference
        </h2>
        <p
          className="mb-6"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.05rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          All endpoints return JSON. The API server runs on port 8000 and the frontend proxies requests via the Vite dev server.
        </p>
        <div className="space-y-4">
          {endpoints.map((ep, i) => (
            <motion.div
              key={ep.path}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 rounded-xl p-4 sm:p-5"
              style={cardStyle}
            >
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="inline-block rounded-md px-2 py-1 text-[0.7rem] font-bold uppercase tracking-wider"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-btn-primary-fg)',
                    background: ep.method === 'GET'
                      ? 'var(--relic-accent-bright)'
                      : ep.method === 'POST'
                        ? 'var(--relic-accent-deep)'
                        : 'var(--relic-text-muted)',
                  }}
                >
                  {ep.method}
                </span>
                <code
                  className="text-sm font-mono break-all"
                  style={{ color: 'var(--relic-text)' }}
                >
                  {ep.path}
                </code>
              </div>
              <p
                className="text-sm leading-relaxed flex-1"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-text-muted)',
                }}
              >
                {ep.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid sm:grid-cols-2 gap-6">
        <section className="rounded-2xl sm:rounded-3xl p-6 sm:p-8" style={panel}>
          <h2
            className="mb-4 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Data Pipeline
          </h2>
          <ol
            className="space-y-3 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>1. Ingestion</strong> — Raw relic records are loaded from
              sample JSON files (database/graph/sample_relics.json) or from a Neo4j graph database when configured.
            </li>
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>2. Normalization</strong> — Image URLs are unified
              (legacy `image` → `image_url`). Empty fields receive sensible defaults. IDs are cast to strings.
            </li>
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>3. Dynasty Parsing</strong> — Noisy period strings
              like "China, Ming dynasty (1368–1644)" are canonicalized to "Ming" via keyword extraction.
            </li>
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>4. Material Parsing</strong> — Verbose medium
              descriptions are parsed into core categories such as Bronze, Jade, Ceramic, Silk, etc.
            </li>
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>5. Description Sanitization</strong> — HTML is
              sanitized client-side: only safe tags (p, em, strong, a, ul, li, blockquote) are preserved.
              Scripts, iframes, and hostile URLs are stripped.
            </li>
          </ol>
        </section>

        <section className="rounded-2xl sm:rounded-3xl p-6 sm:p-8" style={panel}>
          <h2
            className="mb-4 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Technology Stack
          </h2>
          <ul
            className="space-y-3 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>Frontend</strong> — React 18 + TypeScript, React Router
              7, Tailwind CSS 4, Motion (Framer), Recharts, Leaflet, shadcn/ui components, i18next localization.
            </li>
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>Backend</strong> — FastAPI (Python 3.11+), SQLAlchemy ORM
              with SQLite, optional Neo4j graph database integration.
            </li>
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>AI/ML</strong> — OpenAI GPT-4o-mini for natural language
              query parsing. No training data stored; queries are processed statelessly.
            </li>
            <li>
              <strong style={{ color: 'var(--relic-text)' }}>Export Formats</strong> — CSV (RFC 4180), Excel XLSX
              (openpyxl with styled headers), JSON (UTF-8, slim schema). HTML markup is stripped from export cells.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}