import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LandingNav from '@/components/landing/LandingNav';
import TranscriptHero from '@/components/landing/TranscriptHero';
import MomentsSection from '@/components/landing/MomentsSection';
import HeroSection from '@/components/landing/HeroSection';
import BentoSection from '@/components/landing/BentoSection';
import SafetySection from '@/components/landing/SafetySection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  const location = useLocation();

  // When arriving from a footer "Explore" link on another page, scroll to the
  // requested section once mounted — no #hash is put in the URL.
  useEffect(() => {
    const id = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!id) return;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [location.state]);

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
