import { useGameStore } from '../../../store/useGameStore';
import { employeeOutputPerDay } from '../../../sim/staff';
import { ROLE_LABELS, ROLE_COLORS } from '../StaffTab/roleLabels';
import type { Role } from '../../../types';

// Shows per-role: how many employees, total output, how many in-progress cards need this role,
// and highlights bottleneck roles (cards waiting but no/low capacity).
export default function CapacityPlanner({ productId }: { productId: string }) {
  const staff = useGameStore((s) => s.staff);
  const founder = useGameStore((s) => s.founder);
  const product = useGameStore((s) => s.products.find((p) => p.id === productId));
  if (!product) return null;

  const team = staff.filter((e) => e.assignedProductId === productId);

  // For each role on the team OR required by an in-progress card, compute:
  // - available output (sum of employee outputs + founder if matching)
  // - demand (number of in-progress + qa cards needing this role, weighted by remaining effort)
  const roleData = new Map<Role, { output: number; headcount: number; demandCards: number; demandDays: number }>();

  // Initialize from team
  for (const e of team) {
    const cur = roleData.get(e.role) ?? { output: 0, headcount: 0, demandCards: 0, demandDays: 0 };
    cur.output += employeeOutputPerDay(e);
    cur.headcount += 1;
    roleData.set(e.role, cur);
  }
  // Add founder
  if (!founder.hasSteppedBack) {
    const r = founder.specialization;
    const cur = roleData.get(r) ?? { output: 0, headcount: 0, demandCards: 0, demandDays: 0 };
    cur.output += 0.9;
    cur.headcount += 1;
    roleData.set(r, cur);
  }
  // Add demand from in-progress + qa cards
  for (const card of product.kanban) {
    if (card.stage !== 'in_progress' && card.stage !== 'qa') continue;
    for (const req of card.requiredRoles) {
      const cur = roleData.get(req.role) ?? { output: 0, headcount: 0, demandCards: 0, demandDays: 0 };
      cur.demandCards += 1;
      const remaining = Math.max(0, req.effortDays - card.progressDays * (req.effortDays / card.totalEffortDays));
      cur.demandDays += remaining;
      roleData.set(req.role, cur);
    }
  }

  // Sort: bottleneck roles first (demand > 0 and output = 0), then by demand/output ratio
  const roleEntries = Array.from(roleData.entries()).sort((a, b) => {
    const aBottleneck = a[1].demandCards > 0 && a[1].output === 0 ? 1 : 0;
    const bBottleneck = b[1].demandCards > 0 && b[1].output === 0 ? 1 : 0;
    if (aBottleneck !== bBottleneck) return bBottleneck - aBottleneck;
    return b[1].demandCards - a[1].demandCards;
  });

  if (roleEntries.length === 0) {
    return (
      <div className="panel p-3 text-xs text-slate-500">
        No team members and no in-progress cards. Hire staff and start a card to see capacity planning.
      </div>
    );
  }

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Capacity Planner</div>
        <div className="text-[10px] text-slate-500">Bottlenecks highlighted in red</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {roleEntries.map(([role, data]) => {
          const isBottleneck = data.demandCards > 0 && data.output === 0;
          const isOverloaded = data.demandCards > 0 && data.output > 0 && data.demandDays / data.output > 10;
          const eta = data.output > 0 ? Math.ceil(data.demandDays / data.output) : null;
          return (
            <div
              key={role}
              className={`panel-tight p-2 border ${
                isBottleneck ? 'border-accent-rose/40 bg-accent-rose/5' :
                isOverloaded ? 'border-accent-amber/30 bg-accent-amber/5' :
                'border-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`chip ${ROLE_COLORS[role]} text-[9px]`}>{ROLE_LABELS[role]}</span>
                <span className="text-[10px] text-slate-500">{data.headcount}👤</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Output: <span className="text-slate-200 font-semibold">{data.output.toFixed(1)}/d</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Demand: <span className={`font-semibold ${data.demandCards > 0 ? 'text-accent-amber' : 'text-slate-500'}`}>
                  {data.demandCards} card{data.demandCards === 1 ? '' : 's'} · {data.demandDays.toFixed(1)}d
                </span>
              </div>
              {isBottleneck && (
                <div className="text-[9px] text-accent-rose mt-1 font-semibold">⚠ BLOCKED — hire {ROLE_LABELS[role]}</div>
              )}
              {!isBottleneck && eta !== null && data.demandCards > 0 && (
                <div className="text-[9px] text-slate-400 mt-1">ETA: ~{eta}d to clear</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
