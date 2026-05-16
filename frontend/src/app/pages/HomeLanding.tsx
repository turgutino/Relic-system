import { HeroSection } from '@/app/components/HeroSection';
import { StatisticsSection } from '@/app/components/StatisticsSection';
import { FeaturedRelics } from '@/app/components/FeaturedRelics';
import { StorytellingSection } from '@/app/components/StorytellingSection';
import { Footer } from '@/app/components/Footer';

export function HomeLanding() {
  return (
    <>
      <HeroSection />
      <StatisticsSection />
      <FeaturedRelics />
      <StorytellingSection />
      <Footer />
    </>
  );
}
