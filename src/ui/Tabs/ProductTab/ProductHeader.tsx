import type { Product } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';

const TYPE_LABELS: Record<string, string> = {
  saas: 'SaaS Web App',
  mobile: 'Mobile App',
  desktop: 'Desktop App',
  os: 'Operating System',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pre_launch: { label: 'Pre-Launch', color: 'bg-slate-400/20 text-slate-300' },
  live: { label: 'Live', color: 'bg-accent-emerald/20 text-accent-emerald' },
  scaling: { label: 'Scaling', color: 'bg-accent-cyan/20 text-accent-cyan' },
  sunset: { label: 'Sunset', color: 'bg-accent-rose/20 text-accent-rose' },
};

export default function ProductHeader({ product }: { product: Product }) {
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const products = useGameStore((s) => s.products);
  const setActiveProduct = useGameStore((s) => s.setActiveProduct);
  const sunset = useGameStore((s) => s.sunsetProduct);

  const status = STATUS_LABELS[product.status];

  return (
    <div className="panel p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProduct(p.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                p.id === product.id
                  ? 'bg-accent-cyan/20 text-accent-cyan ring-1 ring-accent-cyan/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold truncate">{product.name}</h2>
            <span className="chip bg-white/5 text-slate-400 text-[10px]">{TYPE_LABELS[product.type]}</span>
            <span className={`chip ${status.color} text-[10px]`}>{status.label}</span>
            {product.overload && (
              <span className="chip bg-accent-rose/20 text-accent-rose text-[10px] animate-pulse">⚠ Overloaded</span>
            )}
          </div>
          {product.launchDate !== null && (
            <div className="text-[10px] text-slate-500 mt-0.5">Launched Day {product.launchDate}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          className="btn-secondary text-xs"
          onClick={() => setActiveTab('build')}
        >
          → Build Tab
        </button>
        {product.status !== 'sunset' && (
          <button
            className="btn-danger text-xs"
            onClick={() => {
              if (confirm(`Sunset ${product.name}? Staff will be released to shared services. Costs stop. One-time reputation hit. No refund.`)) {
                sunset(product.id);
              }
            }}
          >
            Sunset
          </button>
        )}
      </div>
    </div>
  );
}
