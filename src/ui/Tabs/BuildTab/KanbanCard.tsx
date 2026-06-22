import { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import type { FeatureCard, Product, Role } from '../../../types';
import { ROLE_LABELS, ROLE_COLORS } from '../../Tabs/StaffTab/roleLabels';
import { predictEtaDays, getBottleneckRole, founderOutputPerDay } from '../../../sim/kanban';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  monetization: 'Money',
  growth: 'Growth',
  retention: 'Retention',
  compliance: 'Compliance',
  infra: 'Infra',
  polish: 'Polish',
};

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: '', color: '' },
  1: { label: '⬆ High', color: 'bg-accent-amber/20 text-accent-amber' },
  2: { label: '⚠ Critical', color: 'bg-accent-rose/20 text-accent-rose' },
};

export default function KanbanCard({ card, product }: { card: FeatureCard; product: Product }) {
  const startCard = useGameStore((s) => s.startCard);
  const cancelCard = useGameStore((s) => s.cancelCard);
  const forceShipCard = useGameStore((s) => s.forceShipCard);
  const cash = useGameStore((s) => s.cash);
  const staff = useGameStore((s) => s.staff);
  const founder = useGameStore((s) => s.founder);
  const selectEmployee = useGameStore((s) => s.selectEmployee);
  const setCardPriority = useGameStore((s) => s.setCardPriority);
  const reorderBacklogCard = useGameStore((s) => s.reorderBacklogCard);
  const deleteCustomCard = useGameStore((s) => s.deleteCustomCard);
  const toggleCardLock = useGameStore((s) => s.toggleCardLock);
  const [showAssign, setShowAssign] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const isLocked = card.stage === 'locked';
  const isBacklog = card.stage === 'backlog';
  const inProgress = card.stage === 'in_progress';
  const inQa = card.stage === 'qa';
  const shipped = card.stage === 'shipped';
  const progressPct = card.totalEffortDays > 0 ? Math.min(100, (card.progressDays / card.totalEffortDays) * 100) : 0;
  const insufficientCash = isBacklog && cash < card.cost;

  // Smart "Blocked" check: blocked if any required role has zero team capacity
  const teamEmployees = staff.filter((e) => e.assignedProductId === product.id);
  const founderForSim = founder.hasSteppedBack ? null : { specialization: founder.specialization, hasSteppedBack: founder.hasSteppedBack };
  const blocked = inProgress && card.requiredRoles.some((req) => {
    const hasMatch = teamEmployees.some((e) => e.role === req.role) ||
      (!founder.hasSteppedBack && founder.specialization === req.role);
    return !hasMatch;
  });

  // ETA prediction
  const eta = inProgress ? predictEtaDays(card, teamEmployees, founderForSim) : null;
  const bottleneck = inProgress ? getBottleneckRole(card, teamEmployees, founderForSim) : null;

  // Assigned employees
  const assignedEmployees = card.assignedEmployeeIds
    .map((id) => staff.find((e) => e.id === id))
    .filter(Boolean) as { id: string; name: string; role: string }[];

  // Available idle employees (matching any required role, not currently on another card)
  const idleMatchingEmployees = teamEmployees.filter(
    (e) => card.requiredRoles.some((r) => r.role === e.role) &&
      !card.assignedEmployeeIds.includes(e.id) &&
      !product.kanban.some((c) => c.stage === 'in_progress' && c.assignedEmployeeIds.includes(e.id) && c.id !== card.id)
  );

  const priority = PRIORITY_LABELS[card.priority ?? 0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`panel-tight p-2.5 border relative ${
        isLocked
          ? 'opacity-50 border-white/5 bg-bg-700/30'
          : shipped
          ? 'border-accent-emerald/20 bg-accent-emerald/5'
          : inQa
          ? 'border-accent-amber/20 bg-accent-amber/5'
          : inProgress
          ? 'border-accent-cyan/20 bg-accent-cyan/5'
          : card.isBug
          ? 'border-accent-rose/30 bg-accent-rose/5'
          : card.isCustom
          ? 'border-accent-violet/30 bg-accent-violet/5'
          : 'border-white/5'
      } ${card.priority === 2 ? 'ring-1 ring-accent-rose/40' : card.priority === 1 ? 'ring-1 ring-accent-amber/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`chip chip-${card.category} text-[9px]`}>{CATEGORY_LABELS[card.category]}</span>
            {card.effect.isMvp && <span className="chip bg-accent-violet/20 text-accent-violet text-[9px]">MVP</span>}
            {card.isCustom && <span className="chip bg-accent-violet/20 text-accent-violet text-[9px]">CUSTOM</span>}
            {card.isBug && <span className="chip bg-accent-rose/20 text-accent-rose text-[9px]">🐛 BUG</span>}
            {priority.label && <span className={`chip ${priority.color} text-[9px]`}>{priority.label}</span>}
            {isLocked && <span className="text-[10px] text-slate-500">🔒</span>}
          </div>
          <div className="text-sm font-medium mt-1">{card.name}</div>
          {card.description && <div className="text-[10px] text-slate-500 mt-0.5">{card.description}</div>}
          {shipped && card.shippedDay !== undefined && (
            <div className="text-[10px] text-accent-emerald mt-0.5">Shipped Day {card.shippedDay}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-500">Cost</div>
          <div className={`text-sm font-semibold ${insufficientCash ? 'text-accent-rose' : 'text-slate-200'}`}>
            ${card.cost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Roles required */}
      <div className="flex items-center gap-1 flex-wrap mt-2">
        {card.requiredRoles.map((r) => {
          const isBottleneck = bottleneck?.role === r.role;
          return (
            <span
              key={r.role}
              className={`chip ${ROLE_COLORS[r.role]} text-[9px] ${isBottleneck ? 'ring-1 ring-accent-rose' : ''}`}
              title={isBottleneck ? `Bottleneck: ${r.role} only producing ${bottleneck?.output.toFixed(2)}/day vs ${r.effortDays}d effort` : ''}
            >
              {ROLE_LABELS[r.role]} {r.effortDays}d{isBottleneck ? ' ⚠' : ''}
            </span>
          );
        })}
      </div>

      {/* Effect line */}
      <EffectLine card={card} />

      {/* Locked prereq tooltip */}
      {isLocked && card.prereqCardIds.length > 0 && (
        <div className="text-[10px] text-slate-500 mt-2">
          Requires: {card.prereqCardIds.map((id) => {
            const prereq = product.kanban.find((c) => c.id === id);
            return prereq?.name ?? id;
          }).join(', ')}
        </div>
      )}

      {/* In-progress: progress bar + assigned avatars + ETA */}
      {inProgress && (
        <div className="mt-2">
          <div className="meter">
            <div className="meter-fill bg-accent-cyan" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-slate-500">{progressPct.toFixed(0)}% · {card.progressDays.toFixed(1)}/{card.totalEffortDays}d</span>
            {blocked && <span className="text-[10px] text-accent-rose">Blocked — no capacity</span>}
            {!blocked && eta !== null && (
              <span className="text-[10px] text-accent-cyan">ETA {eta}d</span>
            )}
          </div>
          {/* Bottleneck warning */}
          {!blocked && bottleneck && bottleneck.output < 0.5 && (
            <div className="text-[10px] text-accent-amber mt-0.5">
              ⚠ Slow: {ROLE_LABELS[bottleneck.role as Role] || bottleneck.role} is the bottleneck
            </div>
          )}
          <div className="flex items-center gap-1 mt-1.5">
            {assignedEmployees.map((e) => (
              <button
                key={e.id}
                onClick={() => selectEmployee(e.id)}
                className="w-6 h-6 rounded-full bg-bg-600 text-[9px] font-bold flex items-center justify-center hover:ring-1 hover:ring-accent-cyan"
                title={e.name}
              >
                {e.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </button>
            ))}
            {assignedEmployees.length === 0 && !blocked && (
              <span className="text-[10px] text-slate-500">Auto-assigns on next tick.</span>
            )}
            {assignedEmployees.length === 0 && blocked && (
              <span className="text-[10px] text-slate-500">Hire matching roles to unblock.</span>
            )}
            {/* Manual assign button */}
            {!blocked && (
              <button
                onClick={() => setShowAssign(!showAssign)}
                className="chip bg-white/5 hover:bg-white/10 text-slate-400 text-[9px] ml-auto"
              >
                {showAssign ? '✕' : '+ Assign'}
              </button>
            )}
          </div>
          {/* Manual assignment popover */}
          <AnimatePresence>
            {showAssign && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 border-t border-white/5 pt-2"
              >
                <div className="text-[10px] text-slate-500 mb-1">Idle matching staff:</div>
                {idleMatchingEmployees.length === 0 ? (
                  <div className="text-[10px] text-slate-500">No idle staff with matching roles.</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {idleMatchingEmployees.map((e) => (
                      <AssignPopover key={e.id} empId={e.id} empName={e.name} empRole={e.role} productId={product.id} cardId={card.id} />
                    ))}
                  </div>
                )}
                {assignedEmployees.length > 0 && (
                  <>
                    <div className="text-[10px] text-slate-500 mt-2 mb-1">Currently assigned:</div>
                    <div className="flex flex-wrap gap-1">
                      {assignedEmployees.map((e) => (
                        <UnassignPopover key={e.id} empId={e.id} empName={e.name} productId={product.id} cardId={card.id} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* QA badge */}
      {inQa && (
        <div className="mt-2 flex items-center justify-between">
          <span className="chip bg-accent-amber/20 text-accent-amber text-[9px]">In QA</span>
          <button
            className="btn-ghost text-[10px] text-accent-amber hover:bg-accent-amber/10"
            onClick={() => forceShipCard(product.id, card.id)}
            title="Force-ship now — raises bug risk"
          >
            ⚠ Force Ship
          </button>
        </div>
      )}

      {/* Shipped effect summary */}
      {shipped && (
        <div className="mt-2 text-[10px] text-accent-emerald/80">
          {summarizeEffect(card)}
          {card.bugRiskAtShip && card.bugRiskAtShip > 0.1 && (
            <span className="text-accent-amber ml-2">⚠ Force-shipped (bug risk {Math.round((card.bugRiskAtShip ?? 0) * 100)}%)</span>
          )}
        </div>
      )}

      {/* Backlog controls: priority + reorder + lock/delete */}
      {isBacklog && (
        <div className="flex items-center gap-1 mt-2 text-[9px]">
          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="chip bg-white/5 hover:bg-white/10 text-slate-400 text-[9px]"
              title="Set priority"
            >
              {priority.label || 'Priority'}
            </button>
            {showPriorityMenu && (
              <div className="absolute z-10 top-full left-0 mt-1 panel p-1 flex flex-col gap-0.5 min-w-[100px]">
                {([0, 1, 2] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setCardPriority(product.id, card.id, p); setShowPriorityMenu(false); }}
                    className="text-left px-2 py-1 text-[10px] rounded hover:bg-white/5 text-slate-300"
                  >
                    {p === 0 ? 'Normal' : p === 1 ? '⬆ High' : '⚠ Critical'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => reorderBacklogCard(product.id, card.id, 'up')}
            className="chip bg-white/5 hover:bg-white/10 text-slate-400 text-[9px]"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => reorderBacklogCard(product.id, card.id, 'down')}
            className="chip bg-white/5 hover:bg-white/10 text-slate-400 text-[9px]"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => toggleCardLock(product.id, card.id)}
            className="chip bg-white/5 hover:bg-white/10 text-slate-400 text-[9px]"
            title="Lock/unlock this card"
          >
            {isLocked ? '🔓' : '🔒'}
          </button>
          {card.isCustom && (
            <button
              onClick={() => {
                if (confirm(`Delete custom card "${card.name}"? This cannot be undone.`)) {
                  deleteCustomCard(product.id, card.id);
                }
              }}
              className="chip bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose text-[9px] ml-auto"
              title="Delete custom card"
            >
              🗑
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1 mt-2">
        {isBacklog && (
          <button
            className="btn-primary flex-1 text-[11px]"
            disabled={insufficientCash}
            onClick={() => startCard(product.id, card.id)}
          >
            {insufficientCash ? 'Not enough cash' : `Start ($${card.cost.toLocaleString()})`}
          </button>
        )}
        {inProgress && (
          <button
            className="btn-ghost flex-1 text-[11px]"
            onClick={() => cancelCard(product.id, card.id)}
          >
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AssignPopover({ empId, empName, empRole, productId, cardId }: { empId: string; empName: string; empRole: string; productId: string; cardId: string }) {
  const assign = useGameStore((s) => s.assignEmployeeToCard);
  return (
    <button
      onClick={() => assign(productId, cardId, empId)}
      className="chip bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan text-[9px]"
      title={`Assign ${empName}`}
    >
      + {empName.split(' ')[0]}
    </button>
  );
}

function UnassignPopover({ empId, empName, productId, cardId }: { empId: string; empName: string; productId: string; cardId: string }) {
  const unassign = useGameStore((s) => s.unassignEmployeeFromCard);
  return (
    <button
      onClick={() => unassign(productId, cardId, empId)}
      className="chip bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose text-[9px]"
      title={`Unassign ${empName}`}
    >
      ✕ {empName.split(' ')[0]}
    </button>
  );
}

function EffectLine({ card }: { card: FeatureCard }) {
  const parts: string[] = [];
  if (card.effect.productScoreDelta) parts.push(`+${card.effect.productScoreDelta} score`);
  if (card.effect.churnMult) parts.push(`${((1 - card.effect.churnMult) * 100).toFixed(0)}% churn`);
  if (card.effect.revenuePerUserMult) parts.push(`+${((card.effect.revenuePerUserMult - 1) * 100).toFixed(0)}% $/user`);
  if (card.effect.growthMult) parts.push(`+${((card.effect.growthMult - 1) * 100).toFixed(0)}% growth`);
  if (card.effect.unlocksMonetizationTier) parts.push(`Unlock ${card.effect.unlocksMonetizationTier}`);
  if (card.effect.customEffect) parts.push(card.effect.customEffect);
  if (parts.length === 0) return null;
  return <div className="text-[10px] text-slate-500 mt-1.5">{parts.join(' · ')}</div>;
}

function summarizeEffect(card: FeatureCard): string {
  const parts: string[] = [];
  if (card.effect.productScoreDelta) parts.push(`+${card.effect.productScoreDelta} score`);
  if (card.effect.churnMult && card.effect.churnMult < 1) parts.push(`−${((1 - card.effect.churnMult) * 100).toFixed(0)}% churn`);
  if (card.effect.revenuePerUserMult && card.effect.revenuePerUserMult > 1) parts.push(`+${((card.effect.revenuePerUserMult - 1) * 100).toFixed(0)}% revenue`);
  if (card.effect.growthMult && card.effect.growthMult > 1) parts.push(`+${((card.effect.growthMult - 1) * 100).toFixed(0)}% growth`);
  return parts.join(' · ');
}
