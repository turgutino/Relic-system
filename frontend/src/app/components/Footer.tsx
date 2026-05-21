import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = useCallback(async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.status === 429) {
        toast.error("Too many attempts. Try again later.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || "Subscription failed. Please try again.");
        return;
      }
      const data = await res.json();
      if (data.already) {
        toast.info("You're already subscribed!");
      } else {
        toast.success("You're subscribed!");
        setSubscribed(true);
        setEmail("");
      }
    } catch {
      toast.error("Subscription failed. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }, [email]);

  const linkGroups = [
    {
      title: t("landing.footer.platformTitle"),
      links: [
        { key: "linkCollections", label: t("landing.footer.linkCollections"), to: "/collections" },
        { key: "linkResearchTools", label: t("landing.footer.linkResearchTools"), to: "/research-tools" },
        { key: "linkArchiveAccess", label: t("landing.footer.linkArchiveAccess"), to: "/archive" },
        { key: "linkDocumentation", label: t("landing.footer.linkDocumentation"), to: "/documentation" },
      ],
    },
    {
      title: t("landing.footer.resourcesTitle"),
      links: [
        { key: "linkAboutUs", label: t("landing.footer.linkAboutUs"), to: "/about" },
        { key: "linkResearchPapers", label: t("landing.footer.linkResearchPapers"), to: "/research-papers" },
        { key: "linkPartnerships", label: t("landing.footer.linkPartnerships"), to: "/partnerships" },
        { key: "linkPressKit", label: t("landing.footer.linkPressKit"), to: "/press-kit" },
      ],
    },
    {
      title: t("landing.footer.supportTitle"),
      links: [
        { key: "linkHelpCenter", label: t("landing.footer.linkHelpCenter"), to: "/help" },
        { key: "linkContactUs", label: t("landing.footer.linkContactUs"), to: "/contact" },
        { key: "linkPrivacy", label: t("landing.footer.linkPrivacy"), to: "/privacy" },
        { key: "linkTerms", label: t("landing.footer.linkTerms"), to: "/terms" },
      ],
    },
  ];

  const social = [
    { label: t("landing.footer.socialTwitter"), href: "#" },
    { label: t("landing.footer.socialLinkedIn"), href: "#" },
    { label: t("landing.footer.socialInstagram"), href: "#" },
  ];

  return (
    <footer className="relative pt-20 sm:pt-28 lg:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 md:px-10 lg:px-12 overflow-x-hidden bg-[var(--relic-page)] transition-colors">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-10 blur-3xl"
        style={{
          background: "radial-gradient(ellipse, var(--relic-accent-bright) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1600px] mx-auto relative z-10 w-full min-w-0">
        <div className="grid lg:grid-cols-12 gap-12 md:gap-16 mb-16 lg:mb-20">
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)",
                  }}
                >
                  <span
                    className="text-xl"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 700,
                      color: "var(--relic-logo-inner)",
                    }}
                  >
                    O
                  </span>
                </div>
                <span
                  className="text-xl"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "var(--relic-text)",
                  }}
                >
                  {t("nav.brand")}
                </span>
              </div>

              <p
                className="mb-8 max-w-md"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.1rem",
                  color: "var(--relic-text-muted)",
                  lineHeight: 1.8,
                }}
              >
                {t("landing.footer.tagline")}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} style={{ color: "var(--relic-accent-bright)" }} />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.9rem",
                      color: "var(--relic-text-muted)",
                    }}
                  >
                    archive@overseasrelic.org
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} style={{ color: "var(--relic-accent-bright)" }} />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.9rem",
                      color: "var(--relic-text-muted)",
                    }}
                  >
                    +1 (555) 123-4567
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} style={{ color: "var(--relic-accent-bright)" }} />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.9rem",
                      color: "var(--relic-text-muted)",
                    }}
                  >
                    Global Heritage Center, New York
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 min-[480px]:grid-cols-3 gap-8 sm:gap-10">
            {linkGroups.map((group, i) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <h4
                  className="mb-6"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--relic-accent-bright)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {group.links.map((item) => (
                    <li key={item.key}>
                      {item.to !== "#" ? (
                        <Link
                          to={item.to}
                          className="inline-block transition-colors hover:!text-[var(--relic-text)] text-[var(--relic-text-muted)]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.9rem",
                          }}
                        >
                          <motion.span whileHover={{ x: 4 }} className="inline-block">
                            {item.label}
                          </motion.span>
                        </Link>
                      ) : (
                        <a
                          href="#"
                          className="inline-block transition-colors hover:!text-[var(--relic-text)] text-[var(--relic-text-muted)]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.9rem",
                          }}
                        >
                          <motion.span whileHover={{ x: 4 }} className="inline-block">
                            {item.label}
                          </motion.span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 sm:mb-16 p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl max-w-full"
          style={{
            background: "var(--relic-accent-muted-bg)",
            border: "1px solid var(--relic-border)",
          }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <h3
              className="mb-4 text-xl sm:text-2xl"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                color: "var(--relic-text)",
              }}
            >
              {t("landing.footer.newsletterTitle")}
            </h3>
            <p
              className="mb-8"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.1rem",
                color: "var(--relic-text-muted)",
                lineHeight: 1.8,
              }}
            >
              {t("landing.footer.newsletterDesc")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t("landing.footer.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !subscribing && !subscribed) {
                    handleSubscribe();
                  }
                }}
                disabled={subscribing || subscribed}
                className="min-w-0 flex-1 w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-full outline-none disabled:opacity-50"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.95rem",
                  background: "var(--relic-input-bg)",
                  border: "1px solid var(--relic-border)",
                  color: "var(--relic-text)",
                }}
              />
              <motion.button
                type="button"
                whileHover={!subscribing && !subscribed ? { scale: 1.05 } : undefined}
                whileTap={!subscribing && !subscribed ? { scale: 0.95 } : undefined}
                onClick={handleSubscribe}
                disabled={subscribing || subscribed}
                className="shrink-0 w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-full whitespace-nowrap disabled:opacity-50"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  background: "linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)",
                  color: "var(--relic-btn-primary-fg)",
                }}
              >
                {subscribed ? t("landing.footer.subscribed") || "Subscribed!" : subscribing ? "Subscribing..." : t("landing.footer.subscribe")}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6"
          style={{
            borderTop: "1px solid var(--relic-border)",
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              color: "var(--relic-text-muted)",
            }}
          >
            {t("landing.footer.copyright", { year: 2026 })}
          </p>
          <div className="flex gap-6">
            {social.map((s) => (
              <motion.a
                key={s.label}
                href={s.href}
                whileHover={{ y: -2 }}
                className="transition-colors hover:!text-[var(--relic-accent-bright)] text-[var(--relic-text-muted)]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                {s.label}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}