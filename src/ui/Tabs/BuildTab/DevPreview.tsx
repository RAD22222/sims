import { useState } from 'react';
import type { Product } from '../../../types';
import { motion } from 'framer-motion';

// Interactive preview of the product being built.
// Shows a mock UI that updates as features ship.
export default function DevPreview({ product }: { product: Product }) {
  const [activeTab, setActiveTab] = useState<'preview' | 'features' | 'stats'>('preview');
  const shippedFeatures = product.kanban.filter((c) => c.stage === 'shipped');
  const hasMvp = shippedFeatures.some((c) => c.effect.isMvp);

  const templateIcon: Record<string, string> = {
    project_mgmt: '📋',
    crm: '🤝',
    analytics: '📊',
    comms: '💬',
    custom: '⚙️',
  };

  return (
    <div className="panel-tight overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 bg-bg-700/80 px-3 py-1.5 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-rose/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald/60" />
        </div>
        <div className="flex-1 bg-bg-900/60 rounded px-2 py-0.5 text-[10px] text-slate-400 font-mono">
          {product.domain ? `https://${product.domain}` : 'localhost:3000/preview'}
        </div>
        <div className="text-[10px] text-slate-500">{templateIcon[product.template || 'custom']}</div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/5 bg-bg-800/40">
        {(['preview', 'features', 'stats'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
              activeTab === t ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="h-64 overflow-y-auto scroll-thin p-3 bg-bg-900/40">
        {!hasMvp && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
            <div className="text-4xl mb-2">🏗️</div>
            <div>Building MVP...</div>
            <div className="text-[10px] mt-1">Preview will appear once the MVP ships.</div>
          </div>
        )}

        {hasMvp && activeTab === 'preview' && (
          <ProductPreview product={product} />
        )}

        {hasMvp && activeTab === 'features' && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-300 mb-2">Shipped Features ({shippedFeatures.length})</div>
            {shippedFeatures.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-xs panel-tight p-1.5">
                <span className="text-accent-emerald">✓</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-[10px] text-slate-500">Day {c.shippedDay}</span>
              </div>
            ))}
          </div>
        )}

        {hasMvp && activeTab === 'stats' && (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="Product Score" value={`${product.productScore}`} />
              <StatBox label="Churn Rate" value={`${(product.churnRate * 100).toFixed(1)}%`} />
              <StatBox label="Users" value={product.users.toLocaleString()} />
              <StatBox label="MRR" value={`$${product.mrr.toLocaleString()}`} />
              <StatBox label="Avg Rating" value={`${product.avgRating}★`} />
              <StatBox label="Open Bugs" value={`${product.bugs.filter((b) => b.status === 'open').length}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductPreview({ product }: { product: Product }) {
  const template = product.template || 'custom';
  const shippedFeatureIds = new Set(
    product.kanban.filter((c) => c.stage === 'shipped').map((c) => c.id)
  );

  // Different preview per template
  if (template === 'project_mgmt') {
    return (
      <div className="text-xs">
        <div className="font-bold text-slate-200 mb-2">📋 {product.name}</div>
        <div className="flex gap-2 mb-2">
          <div className="flex-1 panel-tight p-2">
            <div className="text-[10px] text-slate-500 mb-1">TO DO</div>
            <div className="space-y-1">
              <div className="bg-white/5 p-1 rounded">Design landing page</div>
              <div className="bg-white/5 p-1 rounded">Set up CI/CD</div>
            </div>
          </div>
          <div className="flex-1 panel-tight p-2">
            <div className="text-[10px] text-accent-amber mb-1">DOING</div>
            <div className="space-y-1">
              <div className="bg-accent-amber/10 p-1 rounded">Ship MVP</div>
            </div>
          </div>
          <div className="flex-1 panel-tight p-2">
            <div className="text-[10px] text-accent-emerald mb-1">DONE</div>
            <div className="space-y-1">
              <div className="bg-accent-emerald/10 p-1 rounded">Project setup</div>
            </div>
          </div>
        </div>
        {shippedFeatureIds.size > 1 && (
          <div className="text-[10px] text-slate-500">{shippedFeatureIds.size} features shipped ✓</div>
        )}
      </div>
    );
  }

  if (template === 'crm') {
    return (
      <div className="text-xs">
        <div className="font-bold text-slate-200 mb-2">🤝 {product.name}</div>
        <div className="panel-tight p-2 mb-2">
          <div className="text-[10px] text-slate-500 mb-1">Sales Pipeline</div>
          <div className="flex gap-1">
            <div className="flex-1 bg-white/5 p-1 rounded text-center">
              <div className="text-accent-cyan font-bold">12</div>
              <div className="text-[9px] text-slate-500">Lead</div>
            </div>
            <div className="flex-1 bg-white/5 p-1 rounded text-center">
              <div className="text-accent-amber font-bold">5</div>
              <div className="text-[9px] text-slate-500">Qualified</div>
            </div>
            <div className="flex-1 bg-white/5 p-1 rounded text-center">
              <div className="text-accent-violet font-bold">3</div>
              <div className="text-[9px] text-slate-500">Proposal</div>
            </div>
            <div className="flex-1 bg-white/5 p-1 rounded text-center">
              <div className="text-accent-emerald font-bold">1</div>
              <div className="text-[9px] text-slate-500">Won</div>
            </div>
          </div>
        </div>
        <div className="panel-tight p-2">
          <div className="text-[10px] text-slate-500">Recent Contacts</div>
          <div className="space-y-0.5 mt-1">
            <div className="flex justify-between"><span>Sarah Chen</span><span className="text-accent-emerald">Won</span></div>
            <div className="flex justify-between"><span>Mike Rodriguez</span><span className="text-accent-amber">Qualified</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'analytics') {
    return (
      <div className="text-xs">
        <div className="font-bold text-slate-200 mb-2">📊 {product.name}</div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="panel-tight p-2 text-center">
            <div className="text-accent-cyan font-bold text-lg">{product.users.toLocaleString()}</div>
            <div className="text-[9px] text-slate-500">Active Users</div>
          </div>
          <div className="panel-tight p-2 text-center">
            <div className="text-accent-emerald font-bold text-lg">{Math.round(product.users * 0.4).toLocaleString()}</div>
            <div className="text-[9px] text-slate-500">Daily Events</div>
          </div>
          <div className="panel-tight p-2 text-center">
            <div className="text-accent-violet font-bold text-lg">{(product.churnRate * 100).toFixed(1)}%</div>
            <div className="text-[9px] text-slate-500">Churn</div>
          </div>
        </div>
        {/* Mock chart */}
        <div className="panel-tight p-2">
          <div className="text-[10px] text-slate-500 mb-1">User Growth (7d)</div>
          <div className="flex items-end gap-1 h-16">
            {[40, 55, 50, 70, 65, 85, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 bg-gradient-to-t from-accent-cyan/40 to-accent-cyan rounded-t"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (template === 'comms') {
    return (
      <div className="text-xs">
        <div className="font-bold text-slate-200 mb-2">💬 {product.name}</div>
        <div className="flex gap-2">
          <div className="w-1/3 panel-tight p-2 space-y-1">
            <div className="text-[10px] text-slate-500 mb-1">Channels</div>
            <div className="text-accent-cyan"># general</div>
            <div className="text-slate-400"># random</div>
            <div className="text-slate-400"># engineering</div>
            <div className="text-slate-400">DM · Sarah</div>
          </div>
          <div className="flex-1 panel-tight p-2">
            <div className="text-[10px] text-slate-500 mb-2"># general</div>
            <div className="space-y-2">
              <div><span className="text-accent-violet font-medium">Sarah</span> <span className="text-[9px] text-slate-500">10:30am</span><div>Just shipped the new feature!</div></div>
              <div><span className="text-accent-cyan font-medium">Mike</span> <span className="text-[9px] text-slate-500">10:32am</span><div>Nice work 🎉</div></div>
              <div><span className="text-accent-emerald font-medium">You</span> <span className="text-[9px] text-slate-500">10:35am</span><div>Pushing to production now</div></div>
            </div>
            <div className="mt-2 bg-bg-700 rounded px-2 py-1 text-slate-500">Type a message...</div>
          </div>
        </div>
      </div>
    );
  }

  // Custom
  return (
    <div className="text-xs">
      <div className="font-bold text-slate-200 mb-2">⚙️ {product.name}</div>
      <div className="panel-tight p-3 text-center text-slate-500">
        <div className="text-2xl mb-2">🚧</div>
        <div>Custom product preview</div>
        <div className="text-[10px] mt-1">{shippedFeatureIds.size} features shipped</div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-tight p-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-200">{value}</div>
    </div>
  );
}
