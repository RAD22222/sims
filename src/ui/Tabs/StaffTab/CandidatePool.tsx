import { useGameStore } from '../../../store/useGameStore';
import type { Employee } from '../../../types';
import { ROLE_LABELS } from './roleLabels';

export default function CandidatePool({ onClose }: { onClose?: () => void }) {
  const pool = useGameStore((s) => s.candidatePool);
  const refreshDay = useGameStore((s) => s.candidatePoolRefreshDay);
  const day = useGameStore((s) => s.day);
  const refresh = useGameStore((s) => s.refreshCandidatePool);
  const hire = useGameStore((s) => s.hireCandidate);
  const products = useGameStore((s) => s.products);
  const cash = useGameStore((s) => s.cash);

  const daysUntilRefresh = Math.max(0, refreshDay - day);

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold">Candidate Pool</div>
          <div className="text-[11px] text-slate-500">
            {daysUntilRefresh > 0
              ? `Refreshes in ${daysUntilRefresh} day${daysUntilRefresh === 1 ? '' : 's'}`
              : 'Refresh available'}
          </div>
        </div>
        <button
          className="btn-secondary text-xs"
          disabled={daysUntilRefresh > 0}
          onClick={refresh}
        >
          ↻ Refresh
        </button>
      </div>
      <div className="space-y-2">
        {pool.length === 0 && (
          <div className="text-xs text-slate-500 p-3 text-center">No candidates. Refresh the pool.</div>
        )}
        {pool.map((c) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            onHire={(productId) => {
              if (cash < c.salary * 0.5) {
                alert(`Not enough cash to hire ${c.name}. Need at least half a month's salary in cash.`);
                return;
              }
              hire(c.id, productId);
            }}
            products={products}
          />
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ candidate, onHire, products }: { candidate: Employee; onHire: (productId: string | 'shared') => void; products: { id: string; name: string }[] }) {
  return (
    <div className="panel-tight p-2.5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium">{candidate.name}</div>
          <div className="text-[11px] text-slate-400">
            {ROLE_LABELS[candidate.role]} · <span className="capitalize">{candidate.level}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-accent-emerald">${candidate.salary.toLocaleString()}/mo</div>
          <div className="text-[10px] text-slate-500">Skill {candidate.skill} · Morale {Math.round(candidate.morale)}%</div>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        <span className="text-[10px] text-slate-500 mr-1">Hire to:</span>
        <button
          className="chip bg-white/5 hover:bg-white/10 text-slate-300 text-[10px]"
          onClick={() => onHire('shared')}
        >
          Shared
        </button>
        {products.map((p) => (
          <button
            key={p.id}
            className="chip bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan text-[10px]"
            onClick={() => onHire(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
