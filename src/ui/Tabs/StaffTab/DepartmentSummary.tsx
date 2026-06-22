import { useGameStore } from '../../../store/useGameStore';
import type { Department } from '../../../types';

const DEPARTMENTS: Department[] = [
  'engineering', 'design', 'product', 'marketing', 'sales', 'support', 'hr', 'ops',
];

const DEPT_LABELS: Record<Department, string> = {
  engineering: 'Engineering',
  design: 'Design',
  product: 'Product',
  marketing: 'Marketing',
  sales: 'Sales',
  support: 'Support',
  hr: 'HR',
  ops: 'Ops',
};

const DEPT_ICONS: Record<Department, string> = {
  engineering: '⚙️',
  design: '🎨',
  product: '📐',
  marketing: '📣',
  sales: '💼',
  support: '🎧',
  hr: '🤝',
  ops: '📋',
};

export default function DepartmentSummary({ filterDept, setFilterDept }: { filterDept: Department | 'all'; setFilterDept: (d: Department | 'all') => void }) {
  const staff = useGameStore((s) => s.staff);
  const founder = useGameStore((s) => s.founder);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
      <button
        onClick={() => setFilterDept('all')}
        className={`panel-tight p-2 text-left transition-all ${filterDept === 'all' ? 'ring-1 ring-accent-cyan bg-accent-cyan/5' : 'hover:bg-white/5'}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">All Staff</span>
          <span className="text-lg">{staff.length + (founder.hasSteppedBack ? 0 : 1)}</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Headcount</div>
      </button>
      {DEPARTMENTS.map((dept) => {
        const deptStaff = staff.filter((e) => e.department === dept);
        const payroll = deptStaff.reduce((s, e) => s + e.salary, 0);
        const avgMorale = deptStaff.length > 0 ? Math.round(deptStaff.reduce((s, e) => s + e.morale, 0) / deptStaff.length) : 0;
        return (
          <button
            key={dept}
            onClick={() => setFilterDept(dept)}
            className={`panel-tight p-2 text-left transition-all ${filterDept === dept ? 'ring-1 ring-accent-cyan bg-accent-cyan/5' : 'hover:bg-white/5'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{DEPT_ICONS[dept]} {DEPT_LABELS[dept]}</span>
              <span className="text-lg font-semibold">{deptStaff.length}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              ${payroll.toLocaleString()}/mo · morale {avgMorale || '–'}%
            </div>
          </button>
        );
      })}
    </div>
  );
}
