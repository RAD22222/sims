import { useGameStore } from '../../../store/useGameStore';
import type { Product } from '../../../types';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, Area, AreaChart } from 'recharts';

const TEMPLATE_ICONS: Record<string, string> = {
  project_mgmt: '📋',
  crm: '🤝',
  analytics: '📊',
  comms: '💬',
  custom: '⚙️',
};

export default function ProductPageTab() {
  const products = useGameStore((s) => s.products);
  const activeProductId = useGameStore((s) => s.activeProductId);
  const setActiveProduct = useGameStore((s) => s.setActiveProduct);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const fixBug = useGameStore((s) => s.fixBug);
  const acknowledge = useGameStore((s) => s.acknowledgeFeedback);

  const liveProducts = products.filter((p) => p.status === 'live' || p.status === 'scaling');
  const activeProduct = products.find((p) => p.id === activeProductId) ?? liveProducts[0] ?? products[0];

  if (!activeProduct) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No products yet. Build and release a product first.
      </div>
    );
  }

  const isLive = activeProduct.status === 'live' || activeProduct.status === 'scaling';

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-hidden">
      {/* Product switcher */}
      <div className="panel p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProduct(p.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                p.id === activeProduct.id
                  ? 'bg-accent-cyan/20 text-accent-cyan ring-1 ring-accent-cyan/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <span>{TEMPLATE_ICONS[p.template || 'custom']}</span>
              <span>{p.name}</span>
              {(p.status === 'live' || p.status === 'scaling') && <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />}
            </button>
          ))}
        </div>
        <button className="btn-secondary text-xs" onClick={() => setActiveTab('product')}>
          → Product Config
        </button>
      </div>

      {!isLive ? (
        <div className="panel p-6 text-center text-slate-400">
          <div className="text-2xl mb-2">🏗️</div>
          <div className="text-sm">{activeProduct.name} is currently in <span className="text-accent-amber capitalize">{activeProduct.status.replace('_', ' ')}</span> phase.</div>
          <div className="text-xs mt-1">Release the product to live to see real-time user data, feedback, and bugs here.</div>
          <button className="btn-primary text-xs mt-3" onClick={() => setActiveTab('build')}>→ Go to Build</button>
        </div>
      ) : (
        <LiveProductDashboard product={activeProduct} onFixBug={(bugId) => fixBug(activeProduct.id, bugId)} onAckFeedback={(fbId) => acknowledge(activeProduct.id, fbId)} />
      )}
    </div>
  );
}

function LiveProductDashboard({ product, onFixBug, onAckFeedback }: { product: Product; onFixBug: (id: string) => void; onAckFeedback: (id: string) => void }) {
  const history = useGameStore((s) => s.history).slice(-30);
  const openBugs = product.bugs.filter((b) => b.status === 'open');
  const inProgressBugs = product.bugs.filter((b) => b.status === 'in_progress');
  const recentFeedback = product.feedback.slice(-10).reverse();
  const newFeedback = recentFeedback.filter((f) => f.status === 'new');

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
      {/* Left: Live metrics + chart */}
      <div className="flex flex-col gap-3 overflow-hidden">
        <div className="panel p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Live at</div>
              <div className="text-sm font-mono text-accent-cyan">{product.domain}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-500">Avg Rating</div>
              <div className="text-sm font-bold text-accent-amber">{'★'.repeat(Math.round(product.avgRating))} {product.avgRating}/5</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Users" value={product.users.toLocaleString()} color="text-accent-cyan" />
          <Metric label="MRR" value={`$${product.mrr.toLocaleString()}`} color="text-accent-emerald" />
          <Metric label="Today" value={`+${product.gainedToday} / -${product.churnedToday}`} color="text-slate-200" />
          <Metric label="Revenue Today" value={`$${product.revenueToday.toLocaleString()}`} color="text-accent-emerald" />
          <Metric label="Open Bugs" value={`${openBugs.length}`} color={openBugs.length > 5 ? 'text-accent-rose' : 'text-slate-200'} />
          <Metric label="Support Tickets" value={`${product.supportTickets}`} color={product.supportTickets > 50 ? 'text-accent-amber' : 'text-slate-200'} />
        </div>

        {/* User growth chart */}
        <div className="panel p-3 flex-1 min-h-[200px]">
          <div className="text-xs font-semibold mb-2">User Growth (30 days)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history.map((h) => ({ day: h.day, users: h.totalUsers }))}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ background: '#0f1626', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
                formatter={(v) => [Number(v).toLocaleString(), 'Users']}
              />
              <Area type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={2} fill="url(#userGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle: Live bugs + feedback */}
      <div className="flex flex-col gap-3 overflow-hidden">
        {/* Live Bugs */}
        <div className="panel p-3 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">🐛 Live Bugs</div>
            <span className="text-[10px] text-slate-500">{openBugs.length} open · {inProgressBugs.length} fixing</span>
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin space-y-1.5">
            {openBugs.length === 0 && inProgressBugs.length === 0 && (
              <div className="text-[11px] text-slate-500 p-3 text-center">No live bugs. Users are happy!</div>
            )}
            {openBugs.map((bug) => (
              <div key={bug.id} className="panel-tight p-2 border-accent-rose/20 bg-accent-rose/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium">{bug.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {bug.severity} · reported by {bug.foundBy} · Day {bug.foundDay}
                    </div>
                  </div>
                  <button
                    onClick={() => onFixBug(bug.id)}
                    className="btn-primary text-[9px] py-0.5 px-2"
                  >
                    Fix
                  </button>
                </div>
              </div>
            ))}
            {inProgressBugs.map((bug) => (
              <div key={bug.id} className="panel-tight p-2 border-accent-amber/20 bg-accent-amber/5">
                <div className="text-xs font-medium">{bug.title}</div>
                <div className="meter mt-1">
                  <div className="meter-fill bg-accent-amber" style={{ width: `${(bug.progressDays / bug.fixEffortDays) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Feedback */}
        <div className="panel p-3 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">💬 User Feedback</div>
            <span className="text-[10px] text-slate-500">{newFeedback.length} new</span>
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin space-y-1.5">
            {recentFeedback.length === 0 && (
              <div className="text-[11px] text-slate-500 p-3 text-center">No feedback yet.</div>
            )}
            {recentFeedback.map((f) => (
              <div key={f.id} className={`panel-tight p-2 ${f.status === 'new' ? 'border-accent-cyan/30' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-accent-amber">{'★'.repeat(f.rating)}</span>
                  <span className="text-[10px] text-slate-500">{f.userName}</span>
                  <span className="text-[9px] text-slate-600">· {f.category}</span>
                  {f.status === 'new' && (
                    <button
                      onClick={() => onAckFeedback(f.id)}
                      className="text-[9px] text-accent-cyan hover:underline ml-auto"
                    >✓</button>
                  )}
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">{f.comment}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Real-time activity feed + top features */}
      <div className="flex flex-col gap-3 overflow-hidden">
        <div className="panel p-3">
          <div className="text-sm font-semibold mb-2">📊 Product Health</div>
          <div className="space-y-2 text-xs">
            <HealthBar label="Performance" value={Math.max(20, 100 - openBugs.length * 10 - (product.overload ? 30 : 0))} />
            <HealthBar label="Stability" value={Math.max(20, 100 - openBugs.length * 15)} />
            <HealthBar label="User Satisfaction" value={Math.round((product.avgRating / 5) * 100)} />
            <HealthBar label="Server Load" value={product.overload ? 95 : Math.min(80, (product.users / 5000) * 100)} invert />
          </div>
        </div>

        <div className="panel p-3 flex-1 overflow-hidden flex flex-col">
          <div className="text-sm font-semibold mb-2">✨ Top Features</div>
          <div className="flex-1 overflow-y-auto scroll-thin space-y-1">
            {product.kanban
              .filter((c) => c.stage === 'shipped')
              .sort((a, b) => (b.shippedDay ?? 0) - (a.shippedDay ?? 0))
              .slice(0, 10)
              .map((c) => (
                <div key={c.id} className="flex items-center gap-2 panel-tight p-1.5 text-xs">
                  <span className="text-accent-emerald">✓</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] text-slate-500">Day {c.shippedDay}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="panel p-3">
          <div className="text-sm font-semibold mb-2">📈 Quick Stats</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Total Ratings" value={`${product.totalRatings}`} />
            <Stat label="Lifetime Revenue" value={`$${useGameStore.getState().totalRevenueAllTime.toLocaleString()}`} />
            <Stat label="Churn Rate" value={`${(product.churnRate * 100).toFixed(1)}%`} />
            <Stat label="Product Score" value={`${product.productScore}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="panel-tight p-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-tight p-1.5">
      <div className="text-[9px] text-slate-500">{label}</div>
      <div className="text-xs font-bold text-slate-200">{value}</div>
    </div>
  );
}

function HealthBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  const color = invert
    ? v > 80 ? 'bg-accent-rose' : v > 60 ? 'bg-accent-amber' : 'bg-accent-emerald'
    : v > 70 ? 'bg-accent-emerald' : v > 40 ? 'bg-accent-amber' : 'bg-accent-rose';
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
        <span>{label}</span>
        <span>{Math.round(v)}%</span>
      </div>
      <div className="meter">
        <div className={`meter-fill ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
