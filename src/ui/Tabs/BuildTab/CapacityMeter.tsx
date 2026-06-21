import { useGameStore } from '../../../store/useGameStore';
import type { Role } from '../../../types';
import { employeeOutputPerDay, DEPARTMENT_OF_ROLE } from '../../../sim/staff';
import { ROLE_LABELS } from '../../Tabs/StaffTab/roleLabels';

export default function CapacityMeter({ productId }: { productId: string }) {
  const staff = useGameStore((s) => s.staff);
  const founder = useGameStore((s) => s.founder);
  const product = useGameStore((s) => s.products.find((p) => p.id === productId));
  if (!product) return null;

  // Aggregate capacity per role on this product
  const team = staff.filter((e) => e.assignedProductId === productId);
  const roleMap = new Map<Role, { used: number; available: number }>();
  for (const e of team) {
    const cur = roleMap.get(e.role) ?? { used: 0, available: 0 };
    cur.available += employeeOutputPerDay(e);
    roleMap.set(e.role, cur);
  }
  // Founder contributes
  if (!founder.hasSteppedBack) {
    const r = founder.specialization;
    const cur = roleMap.get(r) ?? { used: 0, available: 0 };
    cur.available += 0.9;
    roleMap.set(r, cur);
  }
  // Compute "used" from in_progress cards
  for (const card of product.kanban) {
    if (card.stage !== 'in_progress') continue;
    for (const empId of card.assignedEmployeeIds) {
      const e = team.find((x) => x.id === empId);
      if (!e) continue;
      const cur = roleMap.get(e.role) ?? { used: 0, available: 0 };
      cur.used += employeeOutputPerDay(e);
      roleMap.set(e.role, cur);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from(roleMap.entries()).map(([role, cap]) => (
        <div
          key={role}
          className="panel-tight px-2 py-1 flex items-center gap-1.5 text-[11px]"
          title={`${ROLE_LABELS[role]}: ${cap.used.toFixed(1)} / ${cap.available.toFixed(1)} role-days/day`}
        >
          <span className="text-slate-400">{ROLE_LABELS[role]}</span>
          <span className={`font-semibold ${cap.used >= cap.available ? 'text-accent-rose' : 'text-accent-emerald'}`}>
            {cap.used.toFixed(1)}/{cap.available.toFixed(1)}
          </span>
        </div>
      ))}
      {roleMap.size === 0 && (
        <span className="text-[11px] text-slate-500">No staff assigned to this product.</span>
      )}
    </div>
  );
}
