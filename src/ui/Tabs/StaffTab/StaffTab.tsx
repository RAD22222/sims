import { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import type { Department, Employee } from '../../../types';
import DepartmentSummary from './DepartmentSummary';
import CandidatePool from './CandidatePool';
import RosterGrid from './RosterGrid';
import EmployeeDetailDrawer from './EmployeeDetailDrawer';
import { ROLE_LABELS } from './roleLabels';

export default function StaffTab() {
  const [filterDept, setFilterDept] = useState<Department | 'all'>('all');
  const [filterProduct, setFilterProduct] = useState<string | 'all' | 'shared'>('all');
  const selectEmployee = useGameStore((s) => s.selectEmployee);
  const products = useGameStore((s) => s.products);
  const staff = useGameStore((s) => s.staff);
  const hasHr = staff.some((e) => e.role === 'hr_manager');
  const cash = useGameStore((s) => s.cash);
  const runCulture = useGameStore((s) => s.runCultureInitiative);

  const handleSelect = (emp: Employee) => {
    selectEmployee(emp.id);
  };

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-hidden">
      <DepartmentSummary filterDept={filterDept} setFilterDept={setFilterDept} />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">Product:</span>
        <FilterPill active={filterProduct === 'all'} onClick={() => setFilterProduct('all')}>All</FilterPill>
        <FilterPill active={filterProduct === 'shared'} onClick={() => setFilterProduct('shared')}>Shared Services</FilterPill>
        {products.map((p) => (
          <FilterPill key={p.id} active={filterProduct === p.id} onClick={() => setFilterProduct(p.id)}>
            {p.name}
          </FilterPill>
        ))}
        <div className="flex-1" />
        {hasHr && (
          <button
            className="btn-secondary text-xs"
            disabled={cash < 10_000}
            onClick={runCulture}
            title="Costs $10,000 — boosts morale company-wide + larger candidate pool going forward"
          >
            🤝 Run Culture Initiative ($10K)
          </button>
        )}
        {!hasHr && staff.length >= 5 && (
          <div className="text-[11px] text-slate-500">💡 Hire an HR Manager to unlock Culture Initiatives.</div>
        )}
      </div>

      <div className="flex-1 flex gap-3 overflow-hidden">
        <div className="w-80 flex flex-col gap-3 overflow-hidden">
          <CandidatePool />
          {!hasHr && (
            <div className="panel p-3 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300 mb-1">HR Unlock</div>
              Hire an <span className="text-accent-cyan">HR Manager</span> to unlock Culture Initiatives
              (cash → company-wide morale boost + larger candidate pool) and reduce company-wide churn.
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <RosterGrid
            filterDept={filterDept}
            filterProduct={filterProduct}
            onSelect={handleSelect}
          />
        </div>
      </div>

      <EmployeeDetailDrawer />
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`chip text-[10px] ${active ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
    >
      {children}
    </button>
  );
}
