import type { Product } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { suggestDomain } from '../../../data/catalogs/saasTemplates';

export default function PostProductionPanel({ product }: { product: Product }) {
  const setDomain = useGameStore((s) => s.setDomain);
  const setDatabase = useGameStore((s) => s.setDatabase);
  const toggleSSL = useGameStore((s) => s.toggleSSL);
  const toggleCDN = useGameStore((s) => s.toggleCDN);
  const releaseProduct = useGameStore((s) => s.releaseProduct);
  const cash = useGameStore((s) => s.cash);

  const dbCosts = { none: 0, shared: 100, dedicated: 500, cluster: 2000 };

  return (
    <div className="panel p-3">
      <div className="text-sm font-semibold mb-2">🚀 Post-Production Setup</div>
      <div className="text-xs text-slate-400 mb-3">
        Configure domain, database, and security before going live. Required: domain + SSL.
      </div>

      {/* Domain */}
      <div className="panel-tight p-2 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">🌐 Domain</span>
          <span className="text-[10px] text-accent-emerald">$500 one-time</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            value={product.domain || ''}
            onChange={(e) => setDomain(product.id, e.target.value)}
            placeholder="myapp.com"
            className="flex-1 bg-bg-700 border border-white/10 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent-cyan"
          />
          <button
            onClick={() => setDomain(product.id, suggestDomain(product.name))}
            className="btn-ghost text-[10px]"
            title="Suggest a domain"
          >🎲</button>
        </div>
        {product.domain && <div className="text-[10px] text-accent-emerald mt-1">✓ {product.domain}</div>}
      </div>

      {/* SSL */}
      <div className="panel-tight p-2 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium">🔒 SSL Certificate</div>
            <div className="text-[10px] text-slate-500">$200 one-time · required for HTTPS</div>
          </div>
          <button
            onClick={() => toggleSSL(product.id)}
            className={`chip text-[10px] ${product.sslEnabled ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-white/5 text-slate-400'}`}
            disabled={!product.sslEnabled && cash < 200}
          >
            {product.sslEnabled ? '✓ Enabled' : 'Enable'}
          </button>
        </div>
      </div>

      {/* CDN */}
      <div className="panel-tight p-2 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium">⚡ CDN</div>
            <div className="text-[10px] text-slate-500">$300 one-time · faster global load</div>
          </div>
          <button
            onClick={() => toggleCDN(product.id)}
            className={`chip text-[10px] ${product.cdnEnabled ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-white/5 text-slate-400'}`}
            disabled={!product.cdnEnabled && cash < 300}
          >
            {product.cdnEnabled ? '✓ Enabled' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Database */}
      <div className="panel-tight p-2 mb-2">
        <div className="text-xs font-medium mb-1">🗄️ Database</div>
        <div className="text-[10px] text-slate-500 mb-2">Monthly cost · scales with users</div>
        <div className="grid grid-cols-4 gap-1">
          {(['none', 'shared', 'dedicated', 'cluster'] as const).map((db) => (
            <button
              key={db}
              onClick={() => setDatabase(product.id, db)}
              disabled={db !== 'none' && product.databaseType === 'none' && cash < dbCosts[db]}
              className={`panel-tight p-1.5 text-center text-[10px] ${
                product.databaseType === db ? 'ring-1 ring-accent-cyan text-accent-cyan' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <div className="font-medium capitalize">{db}</div>
              <div className="text-[9px] text-slate-500">${dbCosts[db]}/mo</div>
            </button>
          ))}
        </div>
      </div>

      {/* Release button */}
      {product.status === 'release_ready' && (
        <button
          onClick={() => releaseProduct(product.id)}
          disabled={!product.domain || !product.sslEnabled}
          className="btn-primary w-full text-xs py-2 mt-2"
          title={!product.domain ? 'Need domain' : !product.sslEnabled ? 'Need SSL' : 'Go live!'}
        >
          🚀 Release to Live {!product.domain || !product.sslEnabled ? '(need domain + SSL)' : ''}
        </button>
      )}
    </div>
  );
}
