import type { GameState, Product, Employee, FeatureCard, Founder } from '../types';
import { employeeOutputPerDay, DEPARTMENT_OF_ROLE } from './staff';
import { getHostingPlan } from '../data/catalogs/hosting';

// Compute founder's contribution as if he were a mid-level employee with skill 70, morale 80
export function founderOutputPerDay(founder: Founder): number {
  if (founder.hasSteppedBack) return 0;
  return 1.0 * (0.5 + 70 / 100) * (0.5 + 80 / 100); // mid-level mult = 1.0
}

// How much daily work each card receives from its assigned employees, weighted by role match.
// Returns role-days of progress per day. If ANY required role has zero workers, returns 0 (stalled).
export function dailyCardProgress(card: FeatureCard, employees: Employee[], founder?: Founder): number {
  let totalOutput = 0;
  for (const req of card.requiredRoles) {
    const matching = employees.filter((e) => e.role === req.role);
    const founderMatch = founder && !founder.hasSteppedBack && founder.specialization === req.role;
    const roleOutput =
      matching.reduce((s, e) => s + employeeOutputPerDay(e), 0) +
      (founderMatch ? founderOutputPerDay(founder) : 0);
    if (roleOutput <= 0) {
      // No one working on this required role — stalled
      return 0;
    }
    totalOutput += roleOutput;
  }
  return totalOutput;
}

export function advanceKanban(state: GameState): GameState {
  const products = state.products.map((p) => {
    if (p.status === 'sunset') return p;
    const teamEmployees = state.staff.filter((e) => e.assignedProductId === p.id);
    const founder = state.founder;
    const updatedKanban = p.kanban.map((card) => ({ ...card, assignedEmployeeIds: [...card.assignedEmployeeIds] }));

    // For each card in_progress, advance progress
    for (const card of updatedKanban) {
      if (card.stage !== 'in_progress') continue;
      // Auto-assign idle employees with matching role if not assigned
      const matchingEmployees = teamEmployees.filter((e) => card.requiredRoles.some((r) => r.role === e.role));
      for (const emp of matchingEmployees) {
        if (!card.assignedEmployeeIds.includes(emp.id) && isEmployeeIdle(emp.id, updatedKanban)) {
          card.assignedEmployeeIds.push(emp.id);
        }
      }
      const daily = dailyCardProgress(card, teamEmployees, founder);
      if (daily > 0) {
        // We advance all role efforts by `daily` days
        // Total progress tracks the bottleneck role, so we add `daily * minRoleEffortShare` to progressDays
        card.progressDays += daily;
      }
      // Check completion: total days across all roles
      if (card.progressDays >= card.totalEffortDays) {
        card.stage = 'qa';
        card.progressDays = card.totalEffortDays;
      }
    }

    // QA: auto-resolves when there's at least one QA employee (or 30% chance per day otherwise)
    // Simpler: any in_qa card with QA staff gets resolved; if no QA staff, after 2 in-game days in QA it auto-ships with bug risk.
    for (const card of updatedKanban) {
      if (card.stage !== 'qa') continue;
      const hasQA = teamEmployees.some((e) => e.role === 'qa');
      // QA cards also get progress; QA employees advance them.
      const qaEmployees = teamEmployees.filter((e) => e.role === 'qa');
      if (qaEmployees.length > 0) {
        const qaOutput = qaEmployees.reduce((s, e) => s + employeeOutputPerDay(e) * 1.5, 0);
        // Each card needs ~2 days of QA work to ship
        card.progressDays += qaOutput;
        if (card.progressDays >= card.totalEffortDays + 2) {
          shipCard(card, state.day);
        }
      } else {
        // No QA — auto-ship after accumulating enough days in QA (use progressDays as proxy since it doesn't move)
        card.bugRiskAtShip = (card.bugRiskAtShip ?? 0) + 1;
        if ((card.bugRiskAtShip ?? 0) >= 3) {
          shipCard(card, state.day, 0.15); // 15% bug risk if force-shipped without QA
        }
      }
    }

    // Apply shipped card effects to product stats
    // Detect MVP ship — if MVP just shipped (or is shipped) and product is still pre_launch, transition to live
    let status = p.status;
    let launchDate = p.launchDate;
    const mvpCard = updatedKanban.find((c) => c.effect.isMvp);
    if (mvpCard && mvpCard.stage === 'shipped' && status === 'pre_launch') {
      status = 'live';
      launchDate = mvpCard.shippedDay ?? state.day;
    }
    // Auto-scale status if users grow large
    if (status === 'live' && p.users > 5000) status = 'scaling';

    // Recompute derived stats from base + shipped cards (deterministic, idempotent)
    const derived = recomputeProductFromShipped(p, updatedKanban);

    return {
      ...p,
      kanban: updatedKanban,
      status,
      launchDate,
      productScore: derived.productScore,
      churnRate: derived.churnRate,
      monetizationTiers: { free: true, pro: derived.pro, enterprise: derived.enterprise },
    };
  });

  return { ...state, products };
}

function isEmployeeIdle(empId: string, kanban: FeatureCard[]): boolean {
  return !kanban.some((c) => c.stage === 'in_progress' && c.assignedEmployeeIds.includes(empId));
}

export function shipCard(card: FeatureCard, day: number, bugRisk = 0.02): void {
  card.stage = 'shipped';
  card.shippedDay = day;
  card.bugRiskAtShip = bugRisk;
}

// Recompute productScore, churnMult, revenueMult, tier unlocks from all shipped cards
export function recomputeProductFromShipped(
  product: Product,
  kanban: FeatureCard[],
): { productScore: number; churnRate: number; revenueMult: number; growthMult: number; pro: boolean; enterprise: boolean } {
  let productScore = 0;
  let churnMult = 1;
  let revenueMult = 1;
  let growthMult = 1;
  let pro = false;
  let enterprise = false;
  for (const card of kanban) {
    if (card.stage !== 'shipped') continue;
    if (card.effect.productScoreDelta) productScore += card.effect.productScoreDelta;
    if (card.effect.churnMult) churnMult *= card.effect.churnMult;
    if (card.effect.revenuePerUserMult) revenueMult *= card.effect.revenuePerUserMult;
    if (card.effect.growthMult) growthMult *= card.effect.growthMult;
    if (card.effect.unlocksMonetizationTier === 'pro') pro = true;
    if (card.effect.unlocksMonetizationTier === 'enterprise') enterprise = true;
  }
  // Base churn depends on product score (higher score = lower churn)
  const baseChurn = Math.max(0.01, 0.08 - productScore * 0.0005);
  const churnRate = Math.max(0.005, baseChurn * churnMult);
  return { productScore, churnRate, revenueMult, growthMult, pro, enterprise };
}

// Force-ship a QA card with raised bug risk
export function forceShip(card: FeatureCard, day: number): void {
  shipCard(card, day, 0.25); // 25% bug risk
}

// Compute total daily work-points contribution per product (for capacity meters)
export function roleCapacityForProduct(
  productId: string,
  role: string,
  staff: Employee[],
  founder: { role: string; hasSteppedBack: boolean } | null,
): { used: number; available: number } {
  const team = staff.filter((e) => e.assignedProductId === productId);
  const available = team.filter((e) => e.role === role).reduce((s, e) => s + employeeOutputPerDay(e), 0)
    + (founder && !founder.hasSteppedBack && founder.role === role ? 0.9 : 0); // founder ~0.9
  const used = 0; // computed at card level
  return { used, available: Math.round(available * 10) / 10 };
}

// Assign idle employees by best skill match when starting a card
export function autoAssignEmployees(card: FeatureCard, staff: Employee[]): string[] {
  const assigned: string[] = [];
  for (const req of card.requiredRoles) {
    const candidates = staff
      .filter((e) => e.role === req.role && e.assignedProductId !== 'shared' || (e.role === req.role && e.assignedProductId === 'shared'))
      .filter((e) => e.role === req.role)
      .sort((a, b) => b.skill - a.skill);
    if (candidates.length > 0) assigned.push(candidates[0].id);
  }
  return assigned;
}
