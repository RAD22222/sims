import { useGameStore } from '../../../store/useGameStore';
import type { Product, Bug } from '../../../types';
import { ROLE_LABELS, ROLE_COLORS } from '../StaffTab/roleLabels';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-slate-400/20 text-slate-300',
  medium: 'bg-accent-amber/20 text-accent-amber',
  high: 'bg-orange-400/20 text-orange-300',
  critical: 'bg-accent-rose/20 text-accent-rose',
};

const SEVERITY_ICON: Record<string, string> = {
  low: '🔵',
  medium: '🟡',
  high: '🟠',
  critical: '🔴',
};

export default function BugsColumn({ product }: { product: Product }) {
  const fixBug = useGameStore((s) => s.fixBug);
  const staff = useGameStore((s) => s.staff);

  const openBugs = product.bugs.filter((b) => b.status === 'open');
  const inProgressBugs = product.bugs.filter((b) => b.status === 'in_progress');
  const fixedBugs = product.bugs.filter((b) => b.status === 'fixed').slice(-10); // last 10 fixed

  return (
    <div className="flex flex-col gap-2 min-w-[280px] w-[300px] panel p-2 overflow-hidden h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-rose" />
          <h3 className="text-sm font-semibold">Bugs</h3>
        </div>
        <span className="text-[10px] text-slate-500">
          {openBugs.length} open · {inProgressBugs.length} fixing · {fixedBugs.length} fixed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin space-y-2 pr-1">
        {openBugs.length === 0 && inProgressBugs.length === 0 && fixedBugs.length === 0 && (
          <div className="text-[11px] text-slate-500 p-3 text-center">
            No bugs yet. Bugs appear during <span className="text-accent-amber">Beta Testing</span> and from <span className="text-accent-cyan">live users</span>.
          </div>
        )}

        {openBugs.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-accent-rose font-semibold mt-1">🔴 Open ({openBugs.length})</div>
            {openBugs.map((bug) => (
              <BugCard key={bug.id} bug={bug} product={product} onFix={() => fixBug(product.id, bug.id)} />
            ))}
          </>
        )}

        {inProgressBugs.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-accent-amber font-semibold mt-2">🟡 Fixing ({inProgressBugs.length})</div>
            {inProgressBugs.map((bug) => (
              <BugCard key={bug.id} bug={bug} product={product} />
            ))}
          </>
        )}

        {fixedBugs.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-accent-emerald font-semibold mt-2">✅ Recently Fixed</div>
            {fixedBugs.map((bug) => (
              <BugCard key={bug.id} bug={bug} product={product} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function BugCard({ bug, product, onFix }: { bug: Bug; product: Product; onFix?: () => void }) {
  const staff = useGameStore((s) => s.staff);
  const assignedEmployees = bug.assignedEmployeeIds
    .map((id) => staff.find((e) => e.id === id))
    .filter(Boolean) as { id: string; name: string }[];

  const progressPct = bug.fixEffortDays > 0 ? Math.min(100, (bug.progressDays / bug.fixEffortDays) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`panel-tight p-2 border ${
        bug.status === 'fixed'
          ? 'border-accent-emerald/20 bg-accent-emerald/5 opacity-60'
          : bug.status === 'in_progress'
          ? 'border-accent-amber/20 bg-accent-amber/5'
          : 'border-accent-rose/20 bg-accent-rose/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className={`chip ${SEVERITY_COLORS[bug.severity]} text-[9px]`}>
              {SEVERITY_ICON[bug.severity]} {bug.severity}
            </span>
            <span className="chip bg-white/5 text-slate-400 text-[9px] capitalize">{bug.foundBy.replace('_', ' ')}</span>
          </div>
          <div className="text-xs font-medium mt-1">{bug.title}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
        <span className={`chip ${ROLE_COLORS[bug.fixRole]} text-[9px]`}>{ROLE_LABELS[bug.fixRole]}</span>
        <span className="text-[10px] text-slate-500">{bug.fixEffortDays}d to fix</span>
        <span className="text-[10px] text-slate-500 ml-auto">Day {bug.foundDay}</span>
      </div>

      {bug.status === 'in_progress' && (
        <div className="mt-2">
          <div className="meter">
            <div className="meter-fill bg-accent-amber" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {progressPct.toFixed(0)}% · {bug.progressDays.toFixed(1)}/{bug.fixEffortDays}d
          </div>
          <div className="flex items-center gap-1 mt-1">
            {assignedEmployees.map((e) => (
              <div key={e.id} className="w-5 h-5 rounded-full bg-bg-600 text-[8px] font-bold flex items-center justify-center">
                {e.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
            ))}
          </div>
        </div>
      )}

      {bug.status === 'fixed' && (
        <div className="text-[10px] text-accent-emerald mt-1">✓ Fixed</div>
      )}

      {bug.status === 'open' && onFix && (
        <button
          onClick={onFix}
          className="btn-primary w-full text-[10px] py-1 mt-2"
        >
          🔧 Fix Bug
        </button>
      )}
    </motion.div>
  );
}
