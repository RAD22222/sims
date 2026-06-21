import type { Product } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { HOSTING_PLANS } from '../../../data/catalogs/hosting';
import { getHostingPlan } from '../../../data/catalogs/hosting';

export default function HostingPanel({ product }: { product: Product }) {
  const setHostingPlan = useGameStore((s) => s.setHostingPlan);
  const currentPlan = getHostingPlan(product.hostingPlanId);
  const loadPct = currentPlan.capacity > 0 ? (product.users / currentPlan.capacity) * 100 : 0;

  const applicablePlans = HOSTING_PLANS.filter((p) => p.productTypes.includes(product.type));

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Hosting</div>
        <span className="text-[10px] text-slate-500">${currentPlan.costMonthly}/mo</span>
      </div>

      <div className="panel-tight p-2 mb-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{currentPlan.name}</span>
          <span className={loadPct > 90 ? 'text-accent-rose font-semibold' : 'text-slate-200'}>
            {loadPct.toFixed(1)}% load
          </span>
        </div>
        <div className="meter mt-1">
          <div
            className={`meter-fill ${loadPct > 90 ? 'bg-accent-rose' : loadPct > 70 ? 'bg-accent-amber' : 'bg-accent-emerald'}`}
            style={{ width: `${Math.min(100, loadPct)}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          {product.users.toLocaleString()} / {currentPlan.capacity.toLocaleString()} users
          {product.overload && <span className="text-accent-rose"> · OVERLOADED — upgrade now!</span>}
        </div>
      </div>

      <div className="space-y-1">
        {applicablePlans.map((p) => (
          <button
            key={p.id}
            onClick={() => setHostingPlan(product.id, p.id)}
            disabled={p.id === currentPlan.id}
            className={`w-full panel-tight p-2 text-left transition-all ${
              p.id === currentPlan.id ? 'ring-1 ring-accent-cyan' : 'hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium">{p.name}</div>
                <div className="text-[10px] text-slate-500">{p.description}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-accent-emerald font-semibold">${p.costMonthly}/mo</div>
                <div className="text-[10px] text-slate-500">{p.autoScales ? 'Auto-scales' : `Cap ${p.capacity.toLocaleString()}`}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
