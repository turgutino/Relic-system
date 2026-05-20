const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

export default function PrivacyPage() {
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
          Privacy Policy
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
            1. Information We Collect
          </h2>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <p>
              <strong style={{ color: 'var(--relic-text)' }}>Account Data:</strong> When you create an account,
              we collect your name, email address, and an encrypted password. This data is used solely for
              authentication and to enable personalized features such as favorites, comments, and browsing history.
            </p>
            <p>
              <strong style={{ color: 'var(--relic-text)' }}>Usage Data:</strong> We may collect anonymous
              analytics about how you interact with the platform (pages viewed, search queries, features used)
              to improve our services. No personally identifiable information is included in usage analytics.
            </p>
            <p>
              <strong style={{ color: 'var(--relic-text)' }}>Public Content:</strong> Comments you post on
              relic pages are publicly visible. Your username is displayed alongside your comments. You can
              delete your own comments at any time.
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
            2. Cookies and Local Storage
          </h2>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <p>
              We use a JWT authentication token stored in local storage to maintain your login session. This token
              is sent with each authenticated request to our API and is cleared when you log out.
            </p>
            <p>
              We do not use third-party tracking cookies, advertising cookies, or any other persistent tracking
              mechanisms. No cookies are placed in your browser by this platform.
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
            3. How We Use Your Data
          </h2>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <p>
              Your personal data is used exclusively for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authenticating your account and providing access to personalized features</li>
              <li>Displaying your username alongside content you voluntarily post (comments)</li>
              <li>Aggregated, anonymized analytics to improve platform performance and usability</li>
              <li>Responding to inquiries submitted through our contact form</li>
            </ul>
            <p>
              We do not sell, rent, or share your personal data with third parties for marketing or any
              other purpose.
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
            4. Data Security
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            We implement industry-standard security measures to protect your data. Passwords are encrypted
            using bcrypt. All API communication occurs over HTTPS. Authentication tokens are short-lived
            and include expiration. We regularly review our security practices and infrastructure.
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
            5. Your Rights
          </h2>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <p>
              You have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access, update, or delete your account information at any time</li>
              <li>Delete individual comments you have posted</li>
              <li>Request a complete export of your personal data</li>
              <li>Request deletion of your account and all associated data</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at privacy@overseasrelic.org.
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
            6. Third-Party Services
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            Our AI search feature sends queries to the OpenAI GPT-4o-mini API. Queries sent to this API are
            processed but not stored or used for model training. External academic resource links (JSTOR,
            CNKI, Getty Research Portal) are provided for reference; we are not responsible for the privacy
            practices of these external sites.
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
            7. Changes to This Policy
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            We may update this privacy policy from time to time. Changes will be posted on this page with an
            updated effective date. Continued use of the platform after changes constitutes acceptance of the
            revised policy.
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
            8. Contact
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            If you have questions about this privacy policy or our data practices, please contact us at{' '}
            <span style={{ color: 'var(--relic-accent-bright)' }}>privacy@overseasrelic.org</span>.
          </p>
        </section>
      </article>
    </div>
  );
}