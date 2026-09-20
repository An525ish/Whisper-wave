import LandingNav from '@/components/landing/LandingNav';
import SparkPassSection from '@/components/landing/SparkPassSection';
import LandingFooter from '@/components/landing/LandingFooter';

const SparkPassPage = () => (
  <div className="landing-page">
    <LandingNav />
    <main>
      <SparkPassSection />
    </main>
    <LandingFooter />
  </div>
);

export default SparkPassPage;
