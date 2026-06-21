import { useGameStore } from '../../../store/useGameStore';
import { ROLE_LABELS, ROLE_COLORS } from './roleLabels';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

export default function EmployeeDetailDrawer() {
  const selectedId = useGameStore((s) => s.selectedEmployeeId);
  const staff = useGameStore((s) => s.staff);
  const products = useGameStore((s) => s.products);
  const selectEmployee = useGameStore((s) => s.selectEmployee);
  const fire = useGameStore((s) => s.fireEmployee);
  const promote = useGameStore((s) => s.promoteEmployeeAction);
  const reassign = useGameStore((s) => s.reassignEmployeeAction);

  const emp = staff.find((e) => e.id === selectedId);
  const open = emp !== undefined;

  const productName = (id: string | 'shared') => id === 'shared' ? 'Shared Services' : products.find((p) => p.id === id)?.name ?? 'Unknown';

  return (
    <AnimatePresence>
      {open && emp && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute right-0 top-0 bottom-0 w-96 max-w-[90%] panel border-l border-white/10 bg-bg-800 flex flex-col z-20"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="text-sm font-semibold">Employee Detail</div>
            <button className="btn-ghost text-xs" onClick={() => selectEmployee(null)}>✕</button>
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-bg-600 flex items-center justify-center text-lg font-bold">
                {emp.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{emp.name}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <span className={`chip ${ROLE_COLORS[emp.role]} text-[9px]`}>{ROLE_LABELS[emp.role]}</span>
                  <span className="capitalize">{emp.level}</span>
                  {emp.isLead && <span className="chip bg-amber-400/20 text-amber-300 text-[9px]">LEAD</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Stat label="Salary" value={`$${emp.salary.toLocaleString()}/mo`} />
              <Stat label="Tenure" value={`${emp.tenureDays}d`} />
              <Stat label="Skill" value={`${emp.skill}/100`} />
              <Stat label="Morale" value={`${Math.round(emp.morale)}%`} />
              <Stat label="Assigned to" value={productName(emp.assignedProductId)} />
              <Stat label="Hired" value={`Day ${emp.hireDate}`} />
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-1">Morale history (last 30 days)</div>
              <div className="h-24 panel-tight p-2">
                {emp.moraleHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emp.moraleHistory.map((v, i) => ({ day: i, morale: v }))}>
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip
                        contentStyle={{ background: '#0f1626', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
                        labelFormatter={(l) => `Day -${emp.moraleHistory.length - 1 - (l as number)}`}
                        formatter={(v) => [`${Math.round(v as number)}%`, 'Morale']}
                      />
                      <Line type="monotone" dataKey="morale" stroke="#fb7185" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-500 text-center pt-6">Not enough history yet.</div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-xs text-slate-500">Reassign to:</div>
              <div className="flex flex-wrap gap-1">
                <button
                  className="chip bg-white/5 hover:bg-white/10 text-slate-300 text-[10px]"
                  onClick={() => reassign(emp.id, 'shared')}
                  disabled={emp.assignedProductId === 'shared'}
                >
                  Shared Services
                </button>
                {products.map((p) => (
                  <button
                    key={p.id}
                    className="chip bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan text-[10px]"
                    onClick={() => reassign(emp.id, p.id)}
                    disabled={emp.assignedProductId === p.id}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                className="btn-secondary w-full"
                disabled={emp.level === 'lead'}
                onClick={() => promote(emp.id)}
              >
                {emp.level === 'lead' ? 'Max level reached' : `Promote to ${nextLevel(emp.level)} (+40% salary)`}
              </button>
              <button
                className="btn-danger w-full"
                onClick={() => {
                  if (confirm(`Let go of ${emp.name}? This frees the desk immediately.`)) {
                    fire(emp.id);
                    selectEmployee(null);
                  }
                }}
              >
                Let Go
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function nextLevel(level: string): string {
  return { junior: 'Mid', mid: 'Senior', senior: 'Lead', lead: '' }[level] || '';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-tight p-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-200">{value}</div>
    </div>
  );
}
