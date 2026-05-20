import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Mail, User, MessageSquare } from 'lucide-react';

const panel = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pt-24 sm:pt-28 pb-16 sm:pb-24 px-3 sm:px-4 md:px-8 xl:px-10 max-w-[1400px] w-full min-w-0 mx-auto bg-[var(--relic-page)] min-h-screen transition-colors">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto text-center rounded-2xl sm:rounded-3xl p-10 sm:p-12 lg:p-14"
          style={panel}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--relic-accent-muted-bg)' }}
          >
            <Send size={24} style={{ color: 'var(--relic-accent-bright)' }} />
          </div>
          <h2
            className="mb-3 text-xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Message Sent
          </h2>
          <p
            className="mb-8 text-sm leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            Thank you for reaching out. We typically respond within 2 business days.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ name: '', email: '', message: '' });
            }}
            className="rounded-full px-5 py-2 text-xs font-medium transition-colors hover:border-[var(--relic-accent-bright)]"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-ghost-btn-text)',
              background: 'transparent',
              border: '1px solid var(--relic-border-accent)',
              cursor: 'pointer',
            }}
          >
            Send Another Message
          </button>
        </motion.div>
      </div>
    );
  }

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
          Contact Us
        </h1>
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.125rem',
            color: 'var(--relic-text-muted)',
          }}
        >
          Have a question, suggestion, or want to collaborate? Send us a message and we&rsquo;ll get back to you.
        </p>
      </header>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10"
            style={panel}
          >
            <div className="space-y-5">
              <div>
                <label
                  className="flex items-center gap-2 mb-2 text-sm font-medium"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-text)',
                  }}
                >
                  <User size={16} style={{ color: 'var(--relic-accent-bright)' }} />
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:opacity-60"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: 'var(--relic-card-grid)',
                    border: '1px solid var(--relic-card-grid-border)',
                    color: 'var(--relic-text)',
                  }}
                />
              </div>
              <div>
                <label
                  className="flex items-center gap-2 mb-2 text-sm font-medium"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-text)',
                  }}
                >
                  <Mail size={16} style={{ color: 'var(--relic-accent-bright)' }} />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:opacity-60"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: 'var(--relic-card-grid)',
                    border: '1px solid var(--relic-card-grid-border)',
                    color: 'var(--relic-text)',
                  }}
                />
              </div>
              <div>
                <label
                  className="flex items-center gap-2 mb-2 text-sm font-medium"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-text)',
                  }}
                >
                  <MessageSquare size={16} style={{ color: 'var(--relic-accent-bright)' }} />
                  Message
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none placeholder:opacity-60"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: 'var(--relic-card-grid)',
                    border: '1px solid var(--relic-card-grid-border)',
                    color: 'var(--relic-text)',
                  }}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors no-underline"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: 'var(--relic-accent-bright)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Send size={14} />
                Send Message
              </button>
            </div>
          </motion.form>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl sm:rounded-3xl p-6 sm:p-8"
          style={panel}
        >
          <h2
            className="mb-4 text-lg"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: 'var(--relic-text)',
            }}
          >
            Other Ways to Reach Us
          </h2>
          <div
            className="space-y-4 text-sm"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--relic-text-muted)',
            }}
          >
            <div>
              <p
                className="mb-1 font-medium"
                style={{ color: 'var(--relic-text)' }}
              >
                Research Inquiries
              </p>
              <p>research@overseasrelic.org</p>
            </div>
            <div>
              <p
                className="mb-1 font-medium"
                style={{ color: 'var(--relic-text)' }}
              >
                Press & Media
              </p>
              <p>press@overseasrelic.org</p>
            </div>
            <div>
              <p
                className="mb-1 font-medium"
                style={{ color: 'var(--relic-text)' }}
              >
                Partnerships
              </p>
              <p>partners@overseasrelic.org</p>
            </div>
            <div>
              <p
                className="mb-1 font-medium"
                style={{ color: 'var(--relic-text)' }}
              >
                Technical Support
              </p>
              <p>support@overseasrelic.org</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}