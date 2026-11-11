import { PricingPage } from '@/features/pass';
import { LandingNav, LandingFooter } from '@/features/landing';

const Pricing = () => (
  <div className="landing-page">
    <LandingNav />
    <main>
      <PricingPage />
    </main>
    <LandingFooter />
  </div>
);

export default Pricing;
