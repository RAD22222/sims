import { useGameStore } from '../../../store/useGameStore';
import FeaturesColumn from './FeaturesColumn';
import DevView from './DevView';
import BugsColumn from './BugsColumn';
import CapacityMeter from './CapacityMeter';
import { motion } from 'framer-motion';

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  saas: 'SaaS',
  mobile: 'Mobile',
  desktop: 'Desktop',
  os: 'OS',
};

const TEMPLATE_ICONS: Record<string, string> = {
  project_mgmt: '📋',
  crm: '🤝',
  analytics: '📊',
  comms: '💬',
  custom: '⚙️',
};

export default function BuildTab() {
  const products = useGameStore((s) => s.products);
  const activeProductId = useGameStore((s) => s.activeProductId);
  const setActiveProduct = useGameStore((s) => s.setActiveProduct);
  const founder = useGameStore((s) => s.founder);
  const stepBack = useGameStore((s) => s.stepBackFounder);
  const triggerAction = useGameStore((s) => s.triggerFounderAction);
  const actionCooldowns = useGameStore((s) => s.founderActionCooldowns);
  const day = useGameStore((s) => s.day);
  const staff = useGameStore((s) => s.staff);

  const activeProduct = products.find((p) => p.id === activeProductId) ?? products[0];

  if (!activeProduct) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No products yet. Click "New Product" to get started.
      </div>
    );
  }

  const founderActionAvailable = (action: string) => {
    const last = actionCooldowns[action] ?? -999;
    return day - last >= 14;
  };

  const canStepBack = !founder.hasSteppedBack && staff.some(
    (e) => e.role === founder.specialization && (e.level === 'mid' || e.level === 'senior' || e.level === 'lead')
  );

  return (
    <div className="h-full flex flex-col gap-2 p-3 overflow-hidden">
      {/* Header */}
      <div className="panel p-3 flex items-center justify-between gap-3 flex-wrap">
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
              <StatusDot status={p.status} />
            </button>
          ))}
          <button
            className="btn-secondary text-xs"
            onClick={() => (window as any).__openNewProductModal?.()}
          >
            + New Product
          </button>
        </div>

        <div className="flex items-center gap-3">
          <CapacityMeter productId={activeProduct.id} />

          {founder.hasSteppedBack ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">Founder:</span>
              <ActionButton label="Pep" cooldown={founderActionAvailable('pep_talk')} cooldownLeft={14 - (day - (actionCooldowns.pep_talk ?? -999))} onClick={() => triggerAction('pep_talk')} />
              <ActionButton label="Crunch" cooldown={founderActionAvailable('crunch_call')} cooldownLeft={14 - (day - (actionCooldowns.crunch_call ?? -999))} onClick={() => triggerAction('crunch_call')} />
              <ActionButton label="Deal" cooldown={founderActionAvailable('close_deal')} cooldownLeft={14 - (day - (actionCooldowns.close_deal ?? -999))} onClick={() => triggerAction('close_deal')} />
              <ActionButton label="Investor" cooldown={founderActionAvailable('investor_call')} cooldownLeft={14 - (day - (actionCooldowns.investor_call ?? -999))} onClick={() => triggerAction('investor_call')} />
            </div>
          ) : (
            <button
              className="btn-secondary text-xs"
              disabled={!canStepBack}
              onClick={() => {
                if (confirm(`Step back as founder? You'll leave your desk and unlock Founder Actions. This is one-way.`)) {
                  stepBack();
                }
              }}
              title={canStepBack ? 'Step back to unlock Founder Actions' : `Requires a Mid+ ${founder.specialization} hire`}
            >
              Step Back
            </button>
          )}
        </div>
      </div>

      {/* 3-column layout: Features | Dev View | Bugs */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        <FeaturesColumn product={activeProduct} />
        <DevView product={activeProduct} />
        <BugsColumn product={activeProduct} />
      </div>
    </div>
  );
}

function ActionButton({ label, cooldown, cooldownLeft, onClick }: { label: string; cooldown: boolean; cooldownLeft: number; onClick: () => void }) {
  return (
    <button
      className={`chip text-[10px] ${cooldown ? 'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
      disabled={!cooldown}
      onClick={onClick}
      title={cooldown ? `${label} — available now` : `${label} — cooldown ${Math.ceil(cooldownLeft)}d`}
    >
      {cooldown ? label : `${label} (${Math.ceil(cooldownLeft)}d)`}
    </button>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = {
    pre_launch: 'bg-slate-500',
    beta: 'bg-accent-amber',
    qa: 'bg-accent-violet',
    release_ready: 'bg-accent-emerald',
    live: 'bg-accent-cyan',
    scaling: 'bg-accent-cyan',
    sunset: 'bg-accent-rose',
  }[status] || 'bg-slate-500';
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}
