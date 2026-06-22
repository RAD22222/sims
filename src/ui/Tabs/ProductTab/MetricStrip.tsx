import type { Product } from '../../../types';

function fmt(n: number, opts: { money?: boolean; pct?: boolean } = {}): string {
  if (opts.pct) return `${(n * 100).toFixed(1)}%`;
  if (opts.money) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${Math.round(n).toLocaleString()}`;
  }
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n).toLocaleString()}`;
}

export default function MetricStrip({ product }: { product: Product }) {
  const metrics = [
    { label: 'Users', value: fmt(product.users), color: 'text-accent-cyan' },
    { label: 'MRR', value: fmt(product.mrr, { money: true }), color: 'text-accent-emerald' },
    { label: 'Churn', value: fmt(product.churnRate, { pct: true }), color: product.churnRate > 0.05 ? 'text-accent-rose' : 'text-slate-200' },
    { label: 'Score', value: `${product.productScore}`, color: 'text-accent-violet' },
    { label: 'Daily P/L', value: fmt(product.revenueToday, { money: true }), color: product.revenueToday >= 0 ? 'text-accent-emerald' : 'text-accent-rose' },
    { label: 'Support Tickets', value: fmt(product.supportTickets), color: product.supportTickets > 50 ? 'text-accent-amber' : 'text-slate-200' },
    { label: 'Today', value: `+${fmt(product.gainedToday)} / -${fmt(product.churnedToday)}`, color: 'text-slate-300' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {metrics.map((m) => (
        <div key={m.label} className="panel-tight p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">{m.label}</div>
          <div className={`text-base font-bold ${m.color}`}>{m.value}</div>
        </div>
      ))}
    </div>
  );
}
