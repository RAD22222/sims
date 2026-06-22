import type { Product } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { ROLE_LABELS, ROLE_COLORS } from '../StaffTab/roleLabels';

export default function TeamPanel({ product }: { product: Product }) {
  const staff = useGameStore((s) => s.staff);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const selectEmployee = useGameStore((s) => s.selectEmployee);
  const founder = useGameStore((s) => s.founder);

  const team = staff.filter((e) => e.assignedProductId === product.id);
  const founderOnTeam = !founder.hasSteppedBack;

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Team ({team.length}{founderOnTeam ? ' + founder' : ''})</div>
        <button className="btn-ghost text-[10px]" onClick={() => setActiveTab('staff')}>→ Staff Tab</button>
      </div>

      {team.length === 0 && !founderOnTeam && (
        <div className="text-[11px] text-slate-500 p-2">
          No dedicated staff. Hire from the Staff tab and assign to this product.
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {founderOnTeam && (
          <div className="flex flex-col items-center gap-0.5 w-12">
            <div className="w-9 h-9 rounded-full bg-accent-violet text-white text-xs font-bold flex items-center justify-center">
              {founder.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="text-[9px] text-accent-violet truncate w-full text-center">Founder</div>
          </div>
        )}
        {team.map((e) => (
          <button
            key={e.id}
            onClick={() => { selectEmployee(e.id); setActiveTab('staff'); }}
            className="flex flex-col items-center gap-0.5 w-12 hover:bg-white/5 rounded p-1"
            title={`${e.name} · ${ROLE_LABELS[e.role]} (${e.level})`}
          >
            <div className="w-9 h-9 rounded-full bg-bg-600 text-slate-300 text-xs font-bold flex items-center justify-center">
              {e.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className={`chip ${ROLE_COLORS[e.role]} text-[8px] truncate w-full text-center`}>
              {ROLE_LABELS[e.role]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
