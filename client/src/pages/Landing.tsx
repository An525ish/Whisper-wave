import LandingNav from '@/components/landing/LandingNav';
import TranscriptHero from '@/components/landing/TranscriptHero';
import HeroSection from '@/components/landing/HeroSection';
import SafetySection from '@/components/landing/SafetySection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  return (
    <div className="landing-page">
      <LandingNav />
      <main>
        <TranscriptHero />
        <HeroSection />
        <SafetySection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
