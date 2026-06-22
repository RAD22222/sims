import type { Product } from '../../../types';

export default function BetaTestersPanel({ product }: { product: Product }) {
  const testers = product.betaTesters;
  const active = testers.filter((t) => t.active && t.daysRemaining > 0);
  const expired = testers.filter((t) => !t.active || t.daysRemaining <= 0);

  return (
    <div className="panel-tight p-3">
      <div className="text-sm font-semibold mb-2">🧪 Beta Testers</div>
      <div className="text-xs text-slate-400 mb-3">
        {active.length} active · {expired.length} expired · {testers.reduce((s, t) => s + t.bugsFound, 0)} bugs found total
      </div>

      <div className="space-y-1.5">
        {active.map((t) => (
          <div key={t.id} className="flex items-center gap-2 panel-tight p-2 bg-accent-amber/5">
            <div className="w-7 h-7 rounded-full bg-accent-amber/20 text-accent-amber text-[10px] font-bold flex items-center justify-center">
              {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">{t.name}</div>
              <div className="text-[10px] text-slate-500">
                Skill {Math.round(t.skill)} · ${t.dailyCost}/day · {t.daysRemaining}d left
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-accent-rose font-semibold">{t.bugsFound}</div>
              <div className="text-[9px] text-slate-500">bugs</div>
            </div>
          </div>
        ))}

        {expired.length > 0 && (
          <>
            <div className="text-[10px] text-slate-500 mt-2">Expired:</div>
            {expired.slice(-3).map((t) => (
              <div key={t.id} className="flex items-center gap-2 panel-tight p-1.5 opacity-50">
                <div className="w-6 h-6 rounded-full bg-bg-600 text-slate-400 text-[9px] font-bold flex items-center justify-center">
                  {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 text-xs">{t.name}</div>
                <div className="text-[10px] text-accent-rose">{t.bugsFound} bugs</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
