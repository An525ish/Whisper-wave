import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LandingNav } from '@/features/landing';
import { TranscriptHero } from '@/features/landing';
import { MomentsSection } from '@/features/landing';
import { HeroSection } from '@/features/landing';
import { BentoSection } from '@/features/landing';
import { SafetySection } from '@/features/landing';
import { FinalCTASection } from '@/features/landing';
import { LandingFooter } from '@/features/landing';

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
