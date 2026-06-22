import type { Product } from '../../../types';

const CATEGORY_ICON: Record<string, string> = {
  core: '⚙',
  monetization: '💰',
  growth: '📈',
  retention: '🔄',
  compliance: '🔒',
  infra: '🏗',
  polish: '✨',
};

export default function ChangelogFeed({ product }: { product: Product }) {
  const shipped = product.kanban
    .filter((c) => c.stage === 'shipped')
    .sort((a, b) => (b.shippedDay ?? 0) - (a.shippedDay ?? 0));

  return (
    <div className="panel p-3 h-full flex flex-col">
      <div className="text-sm font-semibold mb-2">Changelog ({shipped.length} shipped)</div>
      <div className="flex-1 overflow-y-auto scroll-thin space-y-1.5">
        {shipped.length === 0 ? (
          <div className="text-[11px] text-slate-500 p-3 text-center">
            Nothing shipped yet. Start the MVP card from the Build tab to launch.
          </div>
        ) : (
          shipped.map((c) => (
            <div key={c.id} className="panel-tight p-2 flex items-start gap-2">
              <div className="text-base">{CATEGORY_ICON[c.category]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{c.name}</div>
                <div className="text-[10px] text-slate-500">
                  Day {c.shippedDay} · {summarizeEffect(c)}
                </div>
                {c.bugRiskAtShip && c.bugRiskAtShip > 0.1 && (
                  <div className="text-[10px] text-accent-amber">⚠ Force-shipped (high bug risk)</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function summarizeEffect(c: { effect: any }): string {
  const parts: string[] = [];
  const e = c.effect;
  if (e.productScoreDelta) parts.push(`+${e.productScoreDelta} score`);
  if (e.churnMult && e.churnMult < 1) parts.push(`−${((1 - e.churnMult) * 100).toFixed(0)}% churn`);
  if (e.revenuePerUserMult && e.revenuePerUserMult > 1) parts.push(`+${((e.revenuePerUserMult - 1) * 100).toFixed(0)}% revenue`);
  if (e.growthMult && e.growthMult > 1) parts.push(`+${((e.growthMult - 1) * 100).toFixed(0)}% growth`);
  if (e.unlocksMonetizationTier) parts.push(`+${e.unlocksMonetizationTier} tier`);
  if (e.customEffect) parts.push(e.customEffect);
  return parts.join(' · ') || 'Shipped';
}
