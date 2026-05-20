import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, BarChart3, Map, Layers, Scale, FileDown, Clock, Brain } from 'lucide-react';

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const cardStyle = {
  background: 'var(--relic-card-grid)',
  border: '1px solid var(--relic-card-grid-border)',
} as const;

const tools = [
  {
    key: 'ai-search',
    title: 'AI Natural Language Search',
    description: 'Describe what you\'re looking for in plain English. Our AI extracts filters and searches the entire collection intelligently.',
    icon: Brain,
    link: '/catalog',
    linkLabel: 'Try AI Search',
  },
  {
    key: 'timeline',
    title: 'Historical Timeline Explorer',
    description: 'Visualize relics across centuries with an interactive bar chart. Click any century to filter the catalog by date range.',
    icon: Clock,
    link: '/stats',
    linkLabel: 'Open Timeline',
  },
  {
    key: 'museum-map',
    title: 'Museum Map',
    description: 'Explore an interactive geographic map of museums worldwide that house Chinese cultural relics, with counts and details.',
    icon: Map,
    link: '/stats',
    linkLabel: 'View Map',
  },
  {
    key: 'advanced-search',
    title: 'Advanced Search',
    description: 'Combine name, dynasty, material, museum, artist, classification, and date range filters for precise research queries.',
    icon: Search,
    link: '/catalog',
    linkLabel: 'Advanced Search',
  },
  {
    key: 'compare',
    title: 'Side-by-Side Comparison',
    description: 'Select up to three relics and compare their attributes — dynasty, material, museum, description — in a detailed table view.',
    icon: Scale,
    link: '/compare',
    linkLabel: 'Compare Relics',
  },
  {
    key: 'statistics',
    title: 'Collection Statistics',
    description: 'Analyze the distribution of relics by museum, dynasty, and material with interactive bar charts, pie charts, and summary cards.',
    icon: BarChart3,
    link: '/stats',
    linkLabel: 'View Statistics',
  },
  {
    key: 'catalog-export',
    title: 'Data Export',
    description: 'Export filtered catalog results in CSV, Excel (XLSX), or JSON format for offline analysis and research.',
    icon: FileDown,
    link: '/catalog',
    linkLabel: 'Export Data',
  },
  {
    key: 'knowledge-graph',
    title: 'Knowledge Graph',
    description: 'Visualize relationships between relics, dynasties, museums, and materials in an interactive force-directed graph.',
    icon: Layers,
    link: '/stats',
    linkLabel: 'Explore Graph',
  },
];

export default function ResearchToolsPage() {
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
          Research Tools
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          A suite of specialized tools for historians, archaeologists, and cultural heritage researchers studying overseas Chinese relics.
        </p>
      </header>

      <div className="grid min-w-0 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="flex flex-col rounded-2xl overflow-hidden h-full"
            style={cardStyle}
          >
            <div className="p-5 sm:p-6 flex flex-col flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--relic-accent-muted-bg)' }}
              >
                <tool.icon size={20} style={{ color: 'var(--relic-accent-bright)' }} />
              </div>
              <h3
                className="mb-2 text-lg"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  color: 'var(--relic-text)',
                }}
              >
                {tool.title}
              </h3>
              <p
                className="text-sm leading-relaxed flex-1 mb-4"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-text-muted)',
                }}
              >
                {tool.description}
              </p>
              <Link
                to={tool.link}
                className="inline-flex items-center gap-1.5 self-start rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-ghost-btn-text)',
                  border: '1px solid var(--relic-border-accent)',
                }}
              >
                {tool.linkLabel} →
              </Link>
            </div>
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
          Research Methodology
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
              Data Sources
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              Our catalog aggregates metadata from museum open-access APIs, scholarly publications, and institutional
              collection databases. Data is normalized across sources for consistent search and comparison.
            </p>
          </div>
          <div>
            <h3
              className="mb-2 text-base font-semibold"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text)',
              }}
            >
              Curation Process
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              Dynasty labels are canonicalized using keyword extraction. Material strings are parsed into core
              categories (Bronze, Jade, Ceramic, Silk, etc.). Descriptions are sanitized and searchable in
              plain text.
            </p>
          </div>
          <div>
            <h3
              className="mb-2 text-base font-semibold"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text)',
              }}
            >
              AI-Assisted Search
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              The natural language search uses GPT-4o-mini to parse plain-English queries into structured filters:
              dynasty, material, museum, artist, and date range. Results are ranked by relevance.
            </p>
          </div>
          <div>
            <h3
              className="mb-2 text-base font-semibold"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text)',
              }}
            >
              Graph Database
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              When Neo4j is configured, the platform uses a knowledge graph to power relationship queries,
              related relic discovery, and advanced path-based searches across the collection.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}