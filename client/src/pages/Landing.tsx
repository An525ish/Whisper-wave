import LandingNav from '@/components/landing/LandingNav';
import SplashHero from '@/components/landing/SplashHero';
import HeroSection from '@/components/landing/HeroSection';
import SafetySection from '@/components/landing/SafetySection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  return (
    <div className="landing-page">
      <LandingNav />
      <main>
        <SplashHero />
        <HeroSection />
        <SafetySection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
