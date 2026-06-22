import { useGameStore } from '../../../store/useGameStore';
import type { Employee, Department } from '../../../types';
import { ROLE_LABELS, ROLE_COLORS } from './roleLabels';
import { useState } from 'react';

export default function RosterGrid({
  filterDept,
  filterProduct,
  onSelect,
}: {
  filterDept: Department | 'all';
  filterProduct: string | 'all' | 'shared';
  onSelect: (emp: Employee) => void;
}) {
  const staff = useGameStore((s) => s.staff);
  const founder = useGameStore((s) => s.founder);
  const products = useGameStore((s) => s.products);
  const selectedEmployeeId = useGameStore((s) => s.selectedEmployeeId);
  const [sortBy, setSortBy] = useState<'morale' | 'skill' | 'salary' | 'tenure'>('morale');

  const filtered = staff.filter((e) => {
    if (filterDept !== 'all' && e.department !== filterDept) return false;
    if (filterProduct === 'shared' && e.assignedProductId !== 'shared') return false;
    if (filterProduct !== 'all' && filterProduct !== 'shared' && e.assignedProductId !== filterProduct) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'morale') return a.morale - b.morale;
    if (sortBy === 'skill') return b.skill - a.skill;
    if (sortBy === 'salary') return b.salary - a.salary;
    return b.tenureDays - a.tenureDays;
  });

  const productName = (id: string | 'shared') => {
    if (id === 'shared') return 'Shared';
    return products.find((p) => p.id === id)?.name ?? 'Unknown';
  };

  return (
    <div className="panel flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="text-sm font-semibold">
          Roster <span className="text-slate-500 font-normal">({filtered.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-bg-700 border border-white/10 rounded text-xs px-2 py-1 focus:outline-none"
          >
            <option value="morale">Morale (low first)</option>
            <option value="skill">Skill (high first)</option>
            <option value="salary">Salary (high first)</option>
            <option value="tenure">Tenure (long first)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        {/* Founder card (if not stepped back) */}
        {!founder.hasSteppedBack && (
          <div className="px-3 py-2 border-b border-white/5 bg-accent-violet/5 flex items-center gap-3">
            <Avatar name={founder.name} founder />
            <div className="flex-1">
              <div className="text-sm font-semibold flex items-center gap-1">
                {founder.name} <span className="chip bg-accent-violet/20 text-accent-violet text-[9px]">FOUNDER</span>
              </div>
              <div className="text-[11px] text-slate-400">{ROLE_LABELS[founder.specialization]}</div>
            </div>
            <div className="text-[10px] text-slate-500">Occupies founder desk</div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-xs text-slate-500 p-8 text-center">No staff matching filter. Hire from the candidate pool.</div>
        ) : (
          filtered.map((emp) => (
            <button
              key={emp.id}
              onClick={() => onSelect(emp)}
              className={`w-full px-3 py-2 border-b border-white/5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors ${
                selectedEmployeeId === emp.id ? 'bg-accent-cyan/5' : ''
              }`}
            >
              <Avatar name={emp.name} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{emp.name}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`chip ${ROLE_COLORS[emp.role]} text-[9px]`}>{ROLE_LABELS[emp.role]}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{emp.level}</span>
                  {emp.isLead && <span className="chip bg-amber-400/20 text-amber-300 text-[9px]">LEAD</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="text-xs text-slate-300">{productName(emp.assignedProductId)}</div>
                <div className="text-[10px] text-slate-500">${emp.salary.toLocaleString()}/mo</div>
              </div>
              <div className="w-16">
                <Bar label="Skill" value={emp.skill} color="bg-accent-cyan" />
                <Bar label="Morale" value={emp.morale} color={emp.morale < 30 ? 'bg-accent-rose' : emp.morale < 60 ? 'bg-accent-amber' : 'bg-accent-emerald'} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function Avatar({ name, founder }: { name: string; founder?: boolean }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
      founder ? 'bg-accent-violet text-white' : 'bg-bg-600 text-slate-300'
    }`}>
      {initials}
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] text-slate-500 w-7">{label}</span>
      <div className="meter flex-1">
        <div className={`meter-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
