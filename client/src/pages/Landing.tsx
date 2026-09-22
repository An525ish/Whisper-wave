import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandingNav from '@/components/landing/LandingNav';
import TranscriptHero from '@/components/landing/TranscriptHero';
import MomentsSection from '@/components/landing/MomentsSection';
import HeroSection from '@/components/landing/HeroSection';
import BentoSection from '@/components/landing/BentoSection';
import SafetySection from '@/components/landing/SafetySection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

type LandingState = { scrollTo?: string } | null;

const Landing = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const id = (location.state as LandingState)?.scrollTo;
    if (!id) return;

    // Wipe from history immediately — prevents re-scroll on refresh.
    // Use '/' not '.' — relative "." on an index route becomes "?index".
    navigate('/', { replace: true, state: null });

    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — state is read from location at mount time

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
