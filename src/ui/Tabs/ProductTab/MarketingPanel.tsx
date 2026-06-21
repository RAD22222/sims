import type { Product } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';

export default function MarketingPanel({ product }: { product: Product }) {
  const setLevel = useGameStore((s) => s.setMarketingLevel);
  const setSpend = useGameStore((s) => s.setMarketingSpend);

  const levelLabel = ['Off', 'Standard Campaign', 'Aggressive Campaign'][product.marketing.level];
  const levelColor = ['bg-white/5 text-slate-400', 'bg-accent-cyan/10 text-accent-cyan', 'bg-accent-violet/10 text-accent-violet'][product.marketing.level];

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Marketing</div>
        <span className={`chip ${levelColor} text-[10px]`}>{levelLabel}</span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-[11px] text-slate-400 mb-1">Campaign Level</div>
          <div className="flex gap-1">
            {([0, 1, 2] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(product.id, lvl)}
                className={`flex-1 panel-tight py-1.5 text-xs font-medium transition-all ${
                  product.marketing.level === lvl ? 'ring-1 ring-accent-cyan text-accent-cyan' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                {['Off', 'Standard', 'Aggressive'][lvl]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">Daily Spend</span>
            <span className="text-accent-emerald font-semibold">${product.marketing.spendDaily}/day</span>
          </div>
          <input
            type="range"
            min={0}
            max={5000}
            step={100}
            value={product.marketing.spendDaily}
            onChange={(e) => setSpend(product.id, Number(e.target.value))}
            disabled={product.marketing.level === 0}
            className="w-full accent-accent-cyan disabled:opacity-40"
          />
          <div className="text-[10px] text-slate-500 mt-0.5">
            Higher spend = more acquisition (capped at 3x multiplier)
          </div>
        </div>

        <div className="panel-tight p-2 text-[11px]">
          <div className="text-slate-400">Estimated daily acquisition boost</div>
          <div className="text-accent-emerald font-semibold">
            +{((1 + product.marketing.level * 0.5) * Math.min(3, 1 + product.marketing.spendDaily / 1000) * 100 - 100).toFixed(0)}% growth
          </div>
        </div>

        {product.marketingEventLog.length > 0 && (
          <div className="text-[10px] text-slate-500">
            <div className="mb-1">Recent events:</div>
            <div className="space-y-0.5 max-h-16 overflow-y-auto scroll-thin">
              {product.marketingEventLog.slice(-5).reverse().map((e, i) => (
                <div key={i} className={e.type === 'good' ? 'text-accent-emerald' : e.type === 'bad' ? 'text-accent-rose' : 'text-slate-400'}>
                  Day {e.day}: {e.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
