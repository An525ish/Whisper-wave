import { DASHBOARD_MIX_PANEL_CLASS } from '@/constants/admin/dashboard';
import type { DashboardCompositionSegment } from '@/types/admin';
import CompositionBar from './CompositionBar';
import SectionHead from '../shared/SectionHead';

type PlatformMixSectionProps = {
  composition: DashboardCompositionSegment[];
};

const PlatformMixSection = ({ composition }: PlatformMixSectionProps) => (
  <div className="flex flex-col lg:col-span-5">
    <SectionHead
      title="Platform mix"
      subtitle="Entity distribution across the platform"
    />
    <div className={DASHBOARD_MIX_PANEL_CLASS}>
      <CompositionBar segments={composition} className="w-full" />
    </div>
  </div>
);

export default PlatformMixSection;
