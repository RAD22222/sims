import type { Product } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';

export default function MonetizationPanel({ product }: { product: Product }) {
  const setProPrice = useGameStore((s) => s.setProPrice);
  const setEntPrice = useGameStore((s) => s.setEnterprisePrice);

  return (
    <div className="panel p-3">
      <div className="text-sm font-semibold mb-2">Monetization</div>
      <div className="space-y-2">
        <TierCard
          label="Free"
          active={product.monetizationTiers.free}
          body="Always on. Acquires users."
          locked={false}
        />
        <TierCard
          label="Pro"
          active={product.monetizationTiers.pro}
          body="Subscription. Real MRR."
          locked={!product.monetizationTiers.pro}
          price={product.proPrice}
          onPriceChange={(v) => setProPrice(product.id, v)}
          unlockHint="Ship 'Subscription Billing' card"
        />
        <TierCard
          label="Enterprise"
          active={product.monetizationTiers.enterprise}
          body="Highest $/account. Needs Sales to convert."
          locked={!product.monetizationTiers.enterprise}
          price={product.enterprisePrice}
          onPriceChange={(v) => setEntPrice(product.id, v)}
          priceLabel="$/account/mo"
          unlockHint="Ship 'Enterprise Tier + SSO' card"
        />
      </div>
    </div>
  );
}

function TierCard({
  label,
  active,
  body,
  locked,
  price,
  onPriceChange,
  priceLabel = '$/user/mo',
  unlockHint,
}: {
  label: string;
  active: boolean;
  body: string;
  locked: boolean;
  price?: number;
  onPriceChange?: (v: number) => void;
  priceLabel?: string;
  unlockHint?: string;
}) {
  return (
    <div className={`panel-tight p-2.5 ${locked ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`chip text-[10px] ${active ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-white/5 text-slate-500'}`}>
            {active ? '● Live' : '○ Off'}
          </span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        {locked && <span className="text-[10px] text-slate-500">🔒</span>}
      </div>
      <div className="text-[11px] text-slate-400 mt-0.5">{body}</div>
      {locked && unlockHint && (
        <div className="text-[10px] text-slate-500 mt-1">💡 {unlockHint}</div>
      )}
      {active && !locked && price !== undefined && onPriceChange && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">{priceLabel}</span>
            <span className="text-accent-emerald font-semibold">${price}</span>
          </div>
          <input
            type="range"
            min={label === 'Pro' ? 5 : 100}
            max={label === 'Pro' ? 100 : 2000}
            step={label === 'Pro' ? 5 : 50}
            value={price}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            className="w-full accent-accent-cyan"
          />
          <div className="text-[10px] text-slate-500 mt-0.5">Higher price = more $/user, more churn</div>
        </div>
      )}
    </div>
  );
}
