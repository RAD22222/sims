import { useGameStore } from '../../../store/useGameStore';
import type { FeatureCard, Product } from '../../../types';
import { ROLE_LABELS, ROLE_COLORS } from '../../Tabs/StaffTab/roleLabels';
import { motion } from 'framer-motion';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  monetization: 'Money',
  growth: 'Growth',
  retention: 'Retention',
  compliance: 'Compliance',
  infra: 'Infra',
  polish: 'Polish',
};

export default function KanbanCard({ card, product }: { card: FeatureCard; product: Product }) {
  const startCard = useGameStore((s) => s.startCard);
  const cancelCard = useGameStore((s) => s.cancelCard);
  const forceShipCard = useGameStore((s) => s.forceShipCard);
  const cash = useGameStore((s) => s.cash);
  const staff = useGameStore((s) => s.staff);
  const founder = useGameStore((s) => s.founder);
  const selectEmployee = useGameStore((s) => s.selectEmployee);

  const isLocked = card.stage === 'locked';
  const isBacklog = card.stage === 'backlog';
  const inProgress = card.stage === 'in_progress';
  const inQa = card.stage === 'qa';
  const shipped = card.stage === 'shipped';
  const progressPct = card.totalEffortDays > 0 ? Math.min(100, (card.progressDays / card.totalEffortDays) * 100) : 0;
  const insufficientCash = isBacklog && cash < card.cost;

  // Smart "Blocked" check: blocked if any required role has zero team capacity (not just assignedEmployeeIds empty)
  const teamEmployees = staff.filter((e) => e.assignedProductId === product.id);
  const blocked = inProgress && card.requiredRoles.some((req) => {
    const hasMatch = teamEmployees.some((e) => e.role === req.role) ||
      (!founder.hasSteppedBack && founder.specialization === req.role);
    return !hasMatch;
  });

  // Avatar data
  const assignedEmployees = card.assignedEmployeeIds
    .map((id) => staff.find((e) => e.id === id))
    .filter(Boolean) as { id: string; name: string }[];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`panel-tight p-2.5 border ${
        isLocked
          ? 'opacity-50 border-white/5 bg-bg-700/30'
          : shipped
          ? 'border-accent-emerald/20 bg-accent-emerald/5'
          : inQa
          ? 'border-accent-amber/20 bg-accent-amber/5'
          : inProgress
          ? 'border-accent-cyan/20 bg-accent-cyan/5'
          : 'border-white/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`chip chip-${card.category} text-[9px]`}>{CATEGORY_LABELS[card.category]}</span>
            {card.effect.isMvp && <span className="chip bg-accent-violet/20 text-accent-violet text-[9px]">MVP</span>}
            {isLocked && <span className="text-[10px] text-slate-500">🔒</span>}
          </div>
          <div className="text-sm font-medium mt-1 truncate">{card.name}</div>
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
        {card.requiredRoles.map((r) => (
          <span key={r.role} className={`chip ${ROLE_COLORS[r.role]} text-[9px]`}>
            {ROLE_LABELS[r.role]} {r.effortDays}d
          </span>
        ))}
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

      {/* In-progress: progress bar + assigned avatars */}
      {inProgress && (
        <div className="mt-2">
          <div className="meter">
            <div className="meter-fill bg-accent-cyan" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-slate-500">{progressPct.toFixed(0)}% · {card.progressDays.toFixed(1)}/{card.totalEffortDays}d</span>
            {blocked && <span className="text-[10px] text-accent-rose">Blocked — no capacity</span>}
          </div>
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
          </div>
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
