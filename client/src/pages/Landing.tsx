import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import ScrollStorySection from '@/components/landing/ScrollStorySection';
import BentoSection from '@/components/landing/BentoSection';
import ManifestoSection from '@/components/landing/ManifestoSection';
import SparkPassSection from '@/components/landing/SparkPassSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  return (
    <div className="landing-page">
      <LandingNav />
      <main>
        <HeroSection />
        <ScrollStorySection />
        <BentoSection />
        <ManifestoSection />
        <SparkPassSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
