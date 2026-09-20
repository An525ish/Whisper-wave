import LandingNav from '@/components/landing/LandingNav';
import TranscriptHero from '@/components/landing/TranscriptHero';
import MomentsSection from '@/components/landing/MomentsSection';
import HeroSection from '@/components/landing/HeroSection';
import BentoSection from '@/components/landing/BentoSection';
import SafetySection from '@/components/landing/SafetySection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  return (
    <div className="landing-page">
      <LandingNav />
      <main>
        <TranscriptHero />
        <MomentsSection />
        <HeroSection />
        <BentoSection />
        <SafetySection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
