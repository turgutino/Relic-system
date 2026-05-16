import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const btnGrad = "linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)";
const titleGrad = "linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-gold-mid) 100%)";

export function HeroSection() {
  const { t } = useTranslation();
  const titleAfter = t("landing.hero.titleAfter");

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--relic-page)] transition-colors">
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1722785111601-7042acb5d703?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwYXJ0aWZhY3RzJTIwbXVzZXVtJTIwZXhoaWJpdGlvbiUyMGx1eHVyeXxlbnwxfHx8fDE3Nzg1NjM5NjB8MA&ixlib=rb-4.1.0&q=80&w=1920"
          alt={t("landing.hero.imageAlt")}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 transition-colors"
          style={{
            background: `linear-gradient(180deg, var(--relic-hero-stop-1) 0%, var(--relic-hero-stop-2) 50%, var(--relic-hero-stop-3) 100%)`,
          }}
        />
        <div
          className="absolute inset-0 transition-colors"
          style={{
            background: `radial-gradient(circle at center, transparent 0%, var(--relic-hero-vignette) 100%)`,
          }}
        />
      </div>

      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: "var(--relic-particle)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 text-center w-full min-w-0">
        <div className="flex justify-center gap-3 lg:hidden pt-24 sm:pt-28 pb-6">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-6"
        >
          <div
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full mb-8 transition-colors"
            style={{
              background: "var(--relic-accent-muted-bg)",
              border: "1px solid var(--relic-border-accent)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--relic-accent-bright)" }}
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.85rem",
                color: "var(--relic-accent-bright)",
                letterSpacing: "0.05em",
              }}
            >
              {t("landing.hero.badge")}
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-8"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2.5rem, 8vw, 7rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "var(--relic-text)",
            letterSpacing: "-0.02em",
          }}
        >
          {t("landing.hero.titleBefore")}
          <br />
          <span
            style={{
              background: titleGrad,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t("landing.hero.titleHighlight")}
          </span>
          {titleAfter.trim() ? (
            <>
              <br />
              {titleAfter}
            </>
          ) : null}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-3xl mx-auto mb-12"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
            lineHeight: 1.8,
            color: "var(--relic-text-muted)",
            letterSpacing: "0.01em",
          }}
        >
          {t("landing.hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 w-full max-w-md sm:max-w-none mx-auto px-1 sm:px-0"
        >
          <Link to="/catalog" className="contents">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group w-full sm:w-auto justify-center px-8 py-4 sm:px-10 sm:py-5 rounded-full flex items-center gap-3 transition-all no-underline cursor-pointer max-w-full"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "1rem",
                fontWeight: 500,
                background: btnGrad,
                color: "var(--relic-btn-primary-fg)",
                boxShadow: "0 8px 32px rgba(198, 165, 107, 0.28)",
              }}
            >
              {t("landing.hero.explore")}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </motion.span>
          </Link>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group w-full sm:w-auto justify-center px-8 py-4 sm:px-10 sm:py-5 rounded-full flex items-center gap-3 transition-all max-w-full"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              fontWeight: 500,
              background: "var(--relic-accent-muted-bg)",
              border: "1px solid var(--relic-border-accent)",
              color: "var(--relic-text)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--relic-accent-muted-bg)" }}
            >
              <Play
                size={16}
                fill="var(--relic-accent-bright)"
                style={{ color: "var(--relic-accent-bright)" }}
              />
            </div>
            {t("landing.hero.watchStory")}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
