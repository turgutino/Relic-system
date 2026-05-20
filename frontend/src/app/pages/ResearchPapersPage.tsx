import { motion } from 'motion/react';
import { FileText, ExternalLink } from 'lucide-react';

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const cardStyle = {
  background: 'var(--relic-card-grid)',
  border: '1px solid var(--relic-card-grid-border)',
} as const;

const papers = [
  {
    title: 'Digital Provenance: Tracing Chinese Bronzes in Western Collections',
    authors: 'Mitchell, S., Li, W.',
    journal: 'Journal of Digital Heritage, Vol. 12, No. 3 (2024)',
    abstract: 'A computational analysis of Shang and Zhou dynasty bronze vessel dispersion across European and North American museums using graph database techniques.',
  },
  {
    title: 'Canonicalizing Dynasty Labels Across Museum Metadata Standards',
    authors: 'Chen, M., Osei, A.',
    journal: 'Cultural Informatics Quarterly, Vol. 8, No. 1 (2023)',
    abstract: 'Proposes a keyword-extraction pipeline for normalizing noisy dynasty strings (e.g., "China, Ming dynasty (1368–1644)" → "Ming") across heterogeneous museum APIs.',
  },
  {
    title: 'Silk Road Material Culture: A Network Analysis of Textile Dispersal',
    authors: 'Li, W., Nakamura, T.',
    journal: 'Asian Art & Archaeology, Vol. 45 (2023)',
    abstract: 'Maps the geographic dispersal of Chinese silk artifacts from Tang through Yuan periods using museum collection data from 87 countries.',
  },
  {
    title: 'AI-Assisted Natural Language Search for Cultural Heritage Catalogs',
    authors: 'Mitchell, S., Chen, M.',
    journal: 'Proceedings of Digital Humanities 2024',
    abstract: 'Describes the GPT-4o-mini integration that parses plain-English queries into structured filters for the Overseas Relic Knowledge catalog.',
  },
  {
    title: 'Conservation Challenges for Overseas Chinese Lacquerware',
    authors: 'Osei, A., Zhang, H.',
    journal: 'Journal of Conservation Science, Vol. 19, No. 2 (2024)',
    abstract: 'Examines preservation conditions and environmental risks for Chinese lacquerware held in non-Asian museum collections.',
  },
  {
    title: 'Comparative Analysis of Jade Carving Techniques: Neolithic to Qing',
    authors: 'Li, W., Harrison, J.',
    journal: 'World Archaeology Review, Vol. 56, No. 4 (2023)',
    abstract: 'A cross-collection study of jade artifacts in the Metropolitan Museum, British Museum, and Cleveland Museum of Art collections.',
  },
];

export default function ResearchPapersPage() {
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
          Research Papers
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Academic publications, conference proceedings, and scholarly resources related to Chinese cultural heritage research and digital preservation.
        </p>
      </header>

      <div className="space-y-4">
        {papers.map((paper, i) => (
          <motion.div
            key={paper.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-2xl p-5 sm:p-6"
            style={cardStyle}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'var(--relic-accent-muted-bg)' }}
              >
                <FileText size={16} style={{ color: 'var(--relic-accent-bright)' }} />
              </div>
              <div className="min-w-0">
                <h3
                  className="mb-1 text-base"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    color: 'var(--relic-text)',
                  }}
                >
                  {paper.title}
                </h3>
                <p
                  className="mb-2 text-xs italic"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-text-subtle)',
                  }}
                >
                  {paper.authors}
                </p>
                <p
                  className="mb-2 text-xs font-medium tracking-wide uppercase"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-accent-bright)',
                  }}
                >
                  {paper.journal}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-text-muted)',
                  }}
                >
                  {paper.abstract}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="mt-10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <h2
          className="mb-4 text-xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: 'var(--relic-text)',
          }}
        >
          Additional Resources
        </h2>
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: 'var(--relic-text-muted)',
          }}
        >
          For access to full-text PDFs, datasets, and supplementary materials, please contact our research team.
          We also recommend the following external academic databases for Chinese cultural heritage research.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: 'JSTOR — Asian Studies Collection', url: 'https://www.jstor.org/subject/asianstudies' },
            { label: 'China Academic Journals (CNKI)', url: 'https://www.cnki.net' },
            { label: 'Digital Silk Road Project', url: 'https://dsr.nii.ac.jp' },
            { label: 'Getty Research Portal', url: 'https://portal.getty.edu' },
          ].map((resource) => (
            <a
              key={resource.label}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl p-3 transition-colors no-underline hover:bg-[var(--relic-interactive-hover)]"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-accent-bright)',
                background: 'var(--relic-card-grid)',
                border: '1px solid var(--relic-card-grid-border)',
              }}
            >
              <ExternalLink size={14} />
              <span>{resource.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}