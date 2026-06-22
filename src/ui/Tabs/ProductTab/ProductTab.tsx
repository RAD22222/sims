import ProductHeader from './ProductHeader';
import MetricStrip from './MetricStrip';
import MonetizationPanel from './MonetizationPanel';
import HostingPanel from './HostingPanel';
import MarketingPanel from './MarketingPanel';
import TeamPanel from './TeamPanel';
import ChangelogFeed from './ChangelogFeed';
import PostProductionPanel from './PostProductionPanel';
import { useGameStore } from '../../../store/useGameStore';

export default function ProductTab() {
  const products = useGameStore((s) => s.products);
  const activeProductId = useGameStore((s) => s.activeProductId);
  const activeProduct = products.find((p) => p.id === activeProductId) ?? products[0];

  if (!activeProduct) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No products yet. Start one from the Build tab.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-hidden">
      <ProductHeader product={activeProduct} />
      <MetricStrip product={activeProduct} />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
        <div className="flex flex-col gap-3 overflow-hidden">
          {(activeProduct.status === 'release_ready' || activeProduct.status === 'pre_launch' || activeProduct.status === 'beta' || activeProduct.status === 'qa') && (
            <PostProductionPanel product={activeProduct} />
          )}
          <MonetizationPanel product={activeProduct} />
          <MarketingPanel product={activeProduct} />
        </div>
        <div className="flex flex-col gap-3 overflow-hidden">
          <HostingPanel product={activeProduct} />
          <TeamPanel product={activeProduct} />
        </div>
        <div className="overflow-hidden">
          <ChangelogFeed product={activeProduct} />
        </div>
      </div>
    </div>
  );
}
