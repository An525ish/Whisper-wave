import { LandingNav } from '@/features/landing';
import { SparkPassSection } from '@/features/landing';
import { LandingFooter } from '@/features/landing';

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
