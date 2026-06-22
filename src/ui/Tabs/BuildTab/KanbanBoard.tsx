import { useMemo, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import KanbanColumn from './KanbanColumn';
import CapacityMeter from './CapacityMeter';
import CapacityPlanner from './CapacityPlanner';
import CustomCardModal from './CustomCardModal';
import { motion } from 'framer-motion';
import type { CardCategory } from '../../../types';

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  saas: 'SaaS',
  mobile: 'Mobile',
  desktop: 'Desktop',
  os: 'OS',
};

const CATEGORY_FILTERS: { id: CardCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core' },
  { id: 'monetization', label: '💰' },
  { id: 'growth', label: '📈' },
  { id: 'retention', label: '🔄' },
  { id: 'compliance', label: '🔒' },
  { id: 'infra', label: '🏗' },
  { id: 'polish', label: '✨' },
];

export default function KanbanBoard() {
  const products = useGameStore((s) => s.products);
  const activeProductId = useGameStore((s) => s.activeProductId);
  const setActiveProduct = useGameStore((s) => s.setActiveProduct);
  const founder = useGameStore((s) => s.founder);
  const stepBack = useGameStore((s) => s.stepBackFounder);
  const triggerAction = useGameStore((s) => s.triggerFounderAction);
  const actionCooldowns = useGameStore((s) => s.founderActionCooldowns);
  const day = useGameStore((s) => s.day);
  const staff = useGameStore((s) => s.staff);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CardCategory | 'all'>('all');
  const [hideLocked, setHideLocked] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);

  const activeProduct = products.find((p) => p.id === activeProductId) ?? products[0];

  const grouped = useMemo(() => {
    if (!activeProduct) return null;
    const filterFn = (c: typeof activeProduct.kanban[0]) => {
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (hideLocked && c.stage === 'locked') return false;
      return true;
    };
    const backlogRaw = activeProduct.kanban.filter((c) => c.stage === 'backlog' || c.stage === 'locked').filter(filterFn);
    // Sort backlog by priority (critical first), then bugs, then keep original order
    const backlog = [...backlogRaw].sort((a, b) => {
      const pa = a.priority ?? 0;
      const pb = b.priority ?? 0;
      if (pb !== pa) return pb - pa;
      // Bugs next
      if (a.isBug && !b.isBug) return -1;
      if (!a.isBug && b.isBug) return 1;
      return 0;
    });
    const inProgress = activeProduct.kanban.filter((c) => c.stage === 'in_progress');
    const qa = activeProduct.kanban.filter((c) => c.stage === 'qa');
    const shipped = activeProduct.kanban.filter((c) => c.stage === 'shipped');
    return { backlog, inProgress, qa, shipped };
  }, [activeProduct, searchQuery, categoryFilter, hideLocked]);

  if (!activeProduct || !grouped) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Select a product or start a new one.
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

  const isSaas = activeProduct.type === 'saas';

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
              <span>{PRODUCT_TYPE_LABELS[p.type]}</span>
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

          {isSaas && (
            <button
              className="btn-primary text-xs"
              onClick={() => setShowCustomModal(true)}
              title="Design your own feature card"
            >
              + Custom Feature
            </button>
          )}

          {founder.hasSteppedBack ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">Founder:</span>
              <ActionButton label="Pep Talk" cooldown={founderActionAvailable('pep_talk')} cooldownLeft={14 - (day - (actionCooldowns.pep_talk ?? -999))} onClick={() => triggerAction('pep_talk')} />
              <ActionButton label="Crunch" cooldown={founderActionAvailable('crunch_call')} cooldownLeft={14 - (day - (actionCooldowns.crunch_call ?? -999))} onClick={() => triggerAction('crunch_call')} />
              <ActionButton label="Close Deal" cooldown={founderActionAvailable('close_deal')} cooldownLeft={14 - (day - (actionCooldowns.close_deal ?? -999))} onClick={() => triggerAction('close_deal')} />
              <ActionButton label="Investor" cooldown={founderActionAvailable('investor_call')} cooldownLeft={14 - (day - (actionCooldowns.investor_call ?? -999))} onClick={() => triggerAction('investor_call')} />
            </div>
          ) : (
            <button
              className="btn-secondary text-xs"
              disabled={!canStepBack}
              onClick={() => {
                if (confirm(`Step back as founder? You'll leave your desk and unlock Founder Actions. This is one-way. Requires a Mid+ ${founder.specialization} employee to replace you.`)) {
                  stepBack();
                }
              }}
              title={canStepBack ? 'Step back to unlock Founder Actions' : `Requires a Mid+ ${founder.specialization} hire`}
            >
              Step Back (Founder)
            </button>
          )}
        </div>
      </div>

      {/* Pre-launch banner */}
      {activeProduct.status === 'pre_launch' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-tight p-2 text-xs text-slate-400 border-l-2 border-accent-amber"
        >
          🚧 <span className="text-accent-amber font-semibold">Pre-Launch:</span>{' '}
          Ship the <span className="text-accent-violet">MVP / Prototype</span> card to launch this product.
          The 2 starter cards can be worked in parallel but their effects only count after launch.
          {isSaas && <> You can also <button onClick={() => setShowCustomModal(true)} className="text-accent-cyan underline">design custom features</button> for the backlog.</>}
        </motion.div>
      )}

      {/* Backlog filter bar */}
      <div className="panel p-2 flex items-center gap-2 flex-wrap">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search backlog..."
          className="bg-bg-700 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent-cyan w-48"
        />
        <div className="flex items-center gap-0.5">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              className={`px-2 py-1 rounded text-[10px] font-medium ${
                categoryFilter === f.id ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-slate-400 hover:bg-white/5'
              }`}
              title={f.label}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={hideLocked}
            onChange={(e) => setHideLocked(e.target.checked)}
            className="accent-accent-cyan"
          />
          Hide locked
        </label>
        <button
          onClick={() => setShowPlanner(!showPlanner)}
          className={`chip text-[10px] ${showPlanner ? 'bg-accent-violet/20 text-accent-violet' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          title="Show detailed capacity planner"
        >
          📊 Planner
        </button>
        <div className="text-[10px] text-slate-500 ml-auto">
          {grouped.backlog.length} backlog · {grouped.inProgress.length} in-progress · {grouped.shipped.length} shipped
        </div>
      </div>

      {/* Capacity planner (collapsible) */}
      {showPlanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <CapacityPlanner productId={activeProduct.id} />
        </motion.div>
      )}

      {/* Board */}
      <div className="flex-1 flex gap-3 overflow-x-auto scroll-thin">
        <KanbanColumn title="Backlog" cards={grouped.backlog} product={activeProduct} accent="bg-slate-400" emptyText="All cards shipped 🎉" />
        <KanbanColumn title="In Progress" cards={grouped.inProgress} product={activeProduct} accent="bg-accent-cyan" emptyText="Start a card from Backlog" />
        <KanbanColumn title="QA" cards={grouped.qa} product={activeProduct} accent="bg-accent-amber" emptyText="Cards awaiting QA" />
        <KanbanColumn title="Shipped" cards={grouped.shipped} product={activeProduct} accent="bg-accent-emerald" emptyText="Nothing shipped yet" />
      </div>

      {showCustomModal && (
        <CustomCardModal productId={activeProduct.id} onClose={() => setShowCustomModal(false)} />
      )}
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
    live: 'bg-accent-emerald',
    scaling: 'bg-accent-cyan',
    sunset: 'bg-accent-rose',
  }[status] || 'bg-slate-500';
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}
