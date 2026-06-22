import { useGameStore } from '../../../store/useGameStore';
import type { Product, FeatureCard } from '../../../types';
import KanbanCard from './KanbanCard';
import CustomCardModal from './CustomCardModal';
import { useState } from 'react';
import type { CardCategory } from '../../../types';

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

export default function FeaturesColumn({ product }: { product: Product }) {
  const startCard = useGameStore((s) => s.startCard);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CardCategory | 'all'>('all');
  const [hideLocked, setHideLocked] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const filterFn = (c: FeatureCard) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (hideLocked && c.stage === 'locked') return false;
    return true;
  };

  const backlogCards = product.kanban
    .filter((c) => c.stage === 'backlog' || c.stage === 'locked')
    .filter(filterFn)
    .sort((a, b) => {
      const pa = a.priority ?? 0;
      const pb = b.priority ?? 0;
      if (pb !== pa) return pb - pa;
      if (a.isBug && !b.isBug) return -1;
      if (!a.isBug && b.isBug) return 1;
      return 0;
    });

  const inProgressCards = product.kanban.filter((c) => c.stage === 'in_progress');
  const qaCards = product.kanban.filter((c) => c.stage === 'qa');

  return (
    <div className="flex flex-col gap-2 min-w-[280px] w-[300px] panel p-2 overflow-hidden h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-violet" />
          <h3 className="text-sm font-semibold">New Features</h3>
        </div>
        <span className="text-[10px] text-slate-500">{backlogCards.length + inProgressCards.length + qaCards.length}</span>
      </div>

      {/* Search + filters */}
      <div className="space-y-1.5">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search features..."
          className="w-full bg-bg-700 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent-cyan"
        />
        <div className="flex items-center gap-0.5 flex-wrap">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                categoryFilter === f.id ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
          <label className="flex items-center gap-1 text-[9px] text-slate-400 cursor-pointer ml-auto">
            <input type="checkbox" checked={hideLocked} onChange={(e) => setHideLocked(e.target.checked)} className="accent-accent-cyan" />
            Hide 🔒
          </label>
        </div>
        <button
          onClick={() => setShowCustomModal(true)}
          className="w-full btn-secondary text-[10px] py-1"
        >
          + Custom Feature
        </button>
      </div>

      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto scroll-thin space-y-2 pr-1">
        {inProgressCards.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-accent-cyan font-semibold mt-1">In Progress</div>
            {inProgressCards.map((card) => (
              <KanbanCard key={card.id} card={card} product={product} />
            ))}
          </>
        )}
        {qaCards.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-accent-amber font-semibold mt-2">In QA</div>
            {qaCards.map((card) => (
              <KanbanCard key={card.id} card={card} product={product} />
            ))}
          </>
        )}
        {backlogCards.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-2">Backlog</div>
            {backlogCards.map((card) => (
              <KanbanCard key={card.id} card={card} product={product} />
            ))}
          </>
        )}
        {backlogCards.length === 0 && inProgressCards.length === 0 && qaCards.length === 0 && (
          <div className="text-[11px] text-slate-500 p-3 text-center">No features match filters.</div>
        )}
      </div>

      {showCustomModal && (
        <CustomCardModal productId={product.id} onClose={() => setShowCustomModal(false)} />
      )}
    </div>
  );
}
