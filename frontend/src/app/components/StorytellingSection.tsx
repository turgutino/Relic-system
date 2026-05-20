import { motion } from "motion/react";
import { useMemo } from "react";
import { BookOpen, Globe2, Search, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type Feature = {
  icon: typeof BookOpen;
  title: string;
  description: string;
  image: string;
};

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { t } = useTranslation();
  const Icon = feature.icon;
  const isEven = index % 2 === 0;
  const featureNum = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={`landing-storytelling-feature-card ${
        isEven ? "landing-storytelling-feature-card--normal" : "landing-storytelling-feature-card--reverse lg:grid-flow-dense"
      } grid min-w-0 lg:grid-cols-2 gap-10 lg:gap-16 items-center pb-8 lg:pb-0`}
    >
      <motion.div
        className={`landing-storytelling-feature-media relative min-w-0 ${isEven ? "" : "lg:col-start-2"}`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
          <ImageWithFallback
            src={feature.image}
            alt={feature.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(var(--relic-page-rgb), 0.5) 0%, rgba(92, 70, 53, 0.25) 100%)",
            }}
          />
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              border: "1px solid var(--relic-border)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center"
            style={{
              background: "var(--relic-accent-muted-bg)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--relic-border-accent)",
            }}
          >
            <Icon size={26} strokeWidth={1.75} style={{ color: "var(--relic-accent-bright)" }} />
          </motion.div>
        </div>

        <motion.div
          className="landing-storytelling-feature-glow absolute -bottom-6 -right-6 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--relic-accent-bright) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>

      <div className={`landing-storytelling-feature-copy min-w-0 ${isEven ? "" : "lg:col-start-1 lg:row-start-1"}`}>
        <motion.div
          initial={{ opacity: 0, x: isEven ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full mb-6"
            style={{
              background: "var(--relic-accent-muted-bg)",
              border: "1px solid var(--relic-border)",
            }}
          >
            <Icon size={18} style={{ color: "var(--relic-accent-bright)" }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.85rem",
                color: "var(--relic-accent-bright)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {t("landing.storytelling.featureLabel", { num: featureNum })}
            </span>
          </div>

          <h3
            className="mb-6"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.45rem, 6vw, 3rem)",
              fontWeight: 700,
              color: "var(--relic-text)",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {feature.title}
          </h3>

          <p
            className="mb-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1rem, 4vw, 1.25rem)",
              color: "var(--relic-text-muted)",
              lineHeight: 1.8,
            }}
          >
            {feature.description}
          </p>

          <motion.button
            type="button"
            whileHover={{ x: 5 }}
            className="group flex w-full justify-center sm:w-auto sm:justify-start items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.95rem",
              fontWeight: 500,
              background: "var(--relic-accent-muted-bg)",
              border: "1px solid var(--relic-border-accent)",
              color: "var(--relic-accent-bright)",
            }}
          >
            {t("landing.storytelling.learnMore")}
            <motion.span
              className="group-hover:translate-x-1 transition-transform"
            >
              →
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function StorytellingSection() {
  const { t } = useTranslation();

  const features = useMemo<Feature[]>(
    () => [
      {
        icon: BookOpen,
        title: t("landing.storytelling.f1Title"),
        description: t("landing.storytelling.f1Desc"),
        image:
          "https://images.unsplash.com/photo-1765127959724-631190c32e8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      },
      {
        icon: Globe2,
        title: t("landing.storytelling.f2Title"),
        description: t("landing.storytelling.f2Desc"),
        image:
          "https://images.unsplash.com/photo-1664214917702-19fa08c1acf7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      },
      {
        icon: Search,
        title: t("landing.storytelling.f3Title"),
        description: t("landing.storytelling.f3Desc"),
        image:
          "https://images.unsplash.com/photo-1767079831405-066b12a737b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      },
      {
        icon: Shield,
        title: t("landing.storytelling.f4Title"),
        description: t("landing.storytelling.f4Desc"),
        image:
          "https://images.unsplash.com/photo-1765127959629-c7d150e75890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      },
    ],
    [t],
  );

  return (
    <section id="about" className="landing-storytelling-section py-14 sm:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-12 relative overflow-x-clip bg-[var(--relic-page)] transition-colors">
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--relic-accent-bright) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--relic-accent-deep) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1400px] mx-auto relative z-10 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 sm:mb-20 lg:mb-24"
        >
          <h2
            className="mb-6"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.75rem, 7vw, 4rem)",
              fontWeight: 700,
              color: "var(--relic-text)",
              letterSpacing: "-0.02em",
            }}
          >
            {t("landing.storytelling.headline")}
          </h2>
          <p
            className="max-w-3xl mx-auto"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1rem, 4vw, 1.25rem)",
              color: "var(--relic-text-muted)",
              lineHeight: 1.8,
            }}
          >
            {t("landing.storytelling.subhead")}
          </p>
        </motion.div>

        <div className="landing-storytelling-features space-y-20 sm:space-y-28 lg:space-y-32">
          {features.map((feature, index) => (
            <FeatureCard key={`${feature.title}-${index}`} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
