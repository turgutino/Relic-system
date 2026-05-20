const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Last updated: May 15, 2026
        </p>
      </header>

      <article className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 space-y-8" style={panel}>
        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            1. Acceptance of Terms
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            By accessing or using the Overseas Relic Knowledge platform (&ldquo;the Platform&rdquo;),
            you agree to be bound by these Terms of Service. If you do not agree to these terms, please
            do not use the Platform. These terms apply to all visitors, users, and others who access
            the Platform.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            2. Description of Service
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            The Overseas Relic Knowledge platform provides a searchable catalog of Chinese cultural
            relics held in museum collections worldwide. The Platform includes catalog search, faceted
            filtering, AI-assisted natural language search, data export, research tools, statistics
            dashboards, and related research resources.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            3. User Accounts
          </h2>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <p>
              While browsing, searching, and viewing catalog data is available without an account, certain
              features (favorites, comments, history) require registration. You are responsible for
              maintaining the confidentiality of your account credentials and for all activities that
              occur under your account.
            </p>
            <p>
              You agree to provide accurate, current, and complete information during registration and
              to update such information to keep it accurate, current, and complete.
            </p>
          </div>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            4. Acceptable Use
          </h2>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to any part of the Platform or its related systems</li>
              <li>Interfere with or disrupt the Platform or servers or networks connected to the Platform</li>
              <li>Post comments containing hate speech, harassment, spam, or illegal content</li>
              <li>Scrape, data-mine, or systematically extract data from the Platform beyond normal usage</li>
              <li>Misrepresent your affiliation with any person or entity</li>
            </ul>
          </div>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            5. Intellectual Property
          </h2>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <p>
              The relic metadata (names, dates, materials, descriptions, museum attributions) provided
              through the Platform is sourced from publicly accessible museum APIs and scholarly publications.
              Individual relic images and detailed provenance records remain the intellectual property of
              their respective source museums.
            </p>
            <p>
              The Platform&rsquo;s UI design, search algorithms, data parsing pipelines, knowledge graph
              integration, documentation, and original content are the intellectual property of the Overseas
              Relic Knowledge project. Export of catalog data for academic research and educational purposes
              is permitted and encouraged.
            </p>
          </div>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            6. Disclaimers and Limitation of Liability
          </h2>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <p>
              The Platform provides relic metadata &ldquo;as is&rdquo; and makes no warranties regarding
              the accuracy, completeness, or currency of catalog data. While we employ parsing pipelines
              to normalize and validate metadata, the underlying data originates from external museum APIs
              whose accuracy we cannot guarantee.
            </p>
            <p>
              To the fullest extent permitted by law, the Overseas Relic Knowledge project and its
              contributors shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages arising from your use of the Platform.
            </p>
          </div>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            7. Content Moderation
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            We reserve the right to remove comments that violate our acceptable use policy. Users who
            repeatedly violate these terms may have their accounts suspended or terminated. Comment
            moderation decisions are made at our sole discretion.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            8. Termination
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            We may terminate or suspend access to the Platform immediately, without prior notice or
            liability, for any reason, including breach of these Terms. You may discontinue use of the
            Platform at any time. Upon termination, your right to use the Platform will immediately cease.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            9. Changes to Terms
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            We reserve the right to modify or replace these Terms at any time. Material changes will be
            communicated by updating the date at the top of this page. Your continued use of the Platform
            after any changes constitutes your acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2
            className="mb-3 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            10. Contact
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            For questions about these Terms of Service, please contact us at{' '}
            <span style={{ color: 'var(--relic-accent-bright)' }}>legal@overseasrelic.org</span>.
          </p>
        </section>
      </article>
    </div>
  );
}