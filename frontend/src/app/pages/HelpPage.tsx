import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const faqs = [
  {
    question: 'Is the platform free to use?',
    answer: 'Yes. All catalog data, statistics, documentation, and research tools are freely accessible. No login or subscription is required for browsing, searching, or viewing relic details.',
  },
  {
    question: 'Where does the relic data come from?',
    answer: 'We aggregate metadata from museum open-access APIs, scholarly publications, and institutional collection databases. All data includes attribution to the source museum with links back to the original object pages.',
  },
  {
    question: 'Can I export data for my research?',
    answer: 'Yes. Filtered catalog results can be exported in CSV, Excel (XLSX), or JSON format. Use the export button on the catalog page or the dedicated data export tool in Research Tools.',
  },
  {
    question: 'How does the AI search work?',
    answer: 'The natural language search uses GPT-4o-mini to parse plain-English queries into structured filters. For example, typing "show me Ming dynasty vases in London" extracts dynasty=Ming, material=Ceramic, and location=London.',
  },
  {
    question: 'What dynasty and material labels are used?',
    answer: 'Dynasty labels (Shang, Zhou, Han, Tang, Song, Yuan, Ming, Qing, etc.) and material labels (Bronze, Jade, Ceramic, Silk, etc.) are canonicalized through server-side parsing pipelines that normalize inconsistent strings from different museum APIs.',
  },
  {
    question: 'Do I need an account to use the platform?',
    answer: 'No account is required for public features like catalog browsing, search, statistics, and research tools. An account is only needed if you want to save favorites, leave comments, or access personalized history.',
  },
  {
    question: 'How do I find relics from a specific museum?',
    answer: 'Use the catalog filter panel to select a museum from the dropdown, or type the museum name in the search bar. You can also browse by museum on the Statistics page or use the Museum Map tool.',
  },
  {
    question: 'Can I compare relics side by side?',
    answer: 'Yes. From any relic detail page, click "Add to Compare" to add it to your comparison list. You can compare up to three relics at once, viewing their attributes in a detailed table.',
  },
  {
    question: 'How often is the data updated?',
    answer: 'Our catalog is a static dataset that is periodically refreshed. Museums may update their collections at different intervals. Check the Documentation page for details on data provenance and update schedules.',
  },
  {
    question: 'How can I report incorrect data or suggest improvements?',
    answer: 'Please use the Contact page to reach out to our team with corrections, suggestions, or new museum partner recommendations. We review all submissions and work to improve data accuracy.',
  },
];

function FaqItem({ question, answer, defaultOpen }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div
      className="rounded-xl overflow-hidden transition-colors"
      style={{
        background: 'var(--relic-card-grid)',
        border: '1px solid var(--relic-card-grid-border)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[var(--relic-interactive-hover)]"
        style={{
          fontFamily: "'Inter', sans-serif",
          color: 'var(--relic-text)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span className="text-sm font-medium">{question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown size={18} style={{ color: 'var(--relic-text-muted)' }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 text-sm leading-relaxed"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'var(--relic-text-muted)',
              }}
            >
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
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
          Help & FAQ
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Find answers to common questions about using the Overseas Relic Knowledge platform.
        </p>
      </header>

      <section className="mb-10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--relic-accent-muted-bg)' }}
          >
            <HelpCircle size={20} style={{ color: 'var(--relic-accent-bright)' }} />
          </div>
          <h2
            className="text-xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10" style={panel}>
        <h2
          className="mb-4 text-lg"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: 'var(--relic-text)',
          }}
        >
          Still need help?
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: 'var(--relic-text-muted)',
          }}
        >
          If you couldn&rsquo;t find what you were looking for, visit our Contact page to send us a message.
          We typically respond within 2 business days.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors no-underline hover:border-[var(--relic-accent-bright)]"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: 'var(--relic-ghost-btn-text)',
            border: '1px solid var(--relic-border-accent)',
          }}
        >
          Go to Contact Page →
        </a>
      </section>
    </div>
  );
}