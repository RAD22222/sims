import type { GameState, Product, Employee } from '../types';
import { getHostingPlan } from '../data/catalogs/hosting';
import { recomputeProductFromShipped } from './kanban';

// Get all active event modifiers that apply to a given target
export function activeModifiersFor(state: GameState, target: 'company' | string, kind: string): number {
  let mult = 1;
  for (const ev of state.activeEvents) {
    if (!ev.modifiers) continue;
    for (const m of ev.modifiers) {
      if (m.kind !== kind) continue;
      if (m.target === 'company' && target === 'company') mult *= m.mult;
      else if (m.target === target) mult *= m.mult;
      // 'company' modifiers also affect products
      else if (m.target === 'company' && target !== 'company') mult *= m.mult;
    }
  }
  return mult;
}

// Per-product daily user growth + churn + revenue
export function resolveProductEconomy(product: Product, state: GameState): Product {
  // Only 'live' and 'scaling' products generate users/revenue
  if (product.status !== 'live' && product.status !== 'scaling') {
    return { ...product, gainedToday: 0, churnedToday: 0, revenueToday: 0 };
  }

  const derived = recomputeProductFromShipped(product, product.kanban);
  const companyGrowthMod = activeModifiersFor(state, 'company', 'growth');
  const productGrowthMod = activeModifiersFor(state, product.id, 'growth');
  const companyChurnMod = activeModifiersFor(state, 'company', 'churn');
  const productChurnMod = activeModifiersFor(state, product.id, 'churn');
  const companyRevenueMod = activeModifiersFor(state, 'company', 'revenue');

  // Base growth rate depends on product score, marketing, and monetization tier availability
  // Base growth per day in users, as a percentage of current users + a flat acquisition
  const marketingMult = 1 + product.marketing.level * 0.5; // level 0,1,2
  const marketingSpendMult = Math.min(3, 1 + product.marketing.spendDaily / 1000);
  const baseGrowthPct = 0.015 * (product.productScore / 30) * marketingMult * marketingSpendMult * derived.growthMult * companyGrowthMod * productGrowthMod;
  // Flat acquisition baseline — ensures even fresh launches get some users
  const flatAcquisition = Math.max(3, Math.round(4 * marketingMult * marketingSpendMult * companyGrowthMod * productGrowthMod * (1 + product.productScore / 40)));

  // Hosting capacity check
  const hosting = getHostingPlan(product.hostingPlanId);
  const overload = !hosting.autoScales && product.users > hosting.capacity;
  const overloadPenalty = overload ? 0.95 : 1.0; // lose 5% of growth each day while overloaded

  const gainedToday = Math.max(0, Math.round((product.users * baseGrowthPct + flatAcquisition) * overloadPenalty));

  // Churn
  let churnRate = derived.churnRate * companyChurnMod * productChurnMod;
  if (overload) churnRate *= 1.5; // overload adds 50% more churn
  if (product.supportTickets > 50) churnRate *= 1.1; // high ticket backlog raises churn
  churnRate = Math.min(0.5, churnRate);

  const churnedToday = Math.round(product.users * churnRate);
  const newUsers = Math.max(0, product.users + gainedToday - churnedToday);

  // Revenue: based on monetization tiers + price + users
  // Free users pay $0; assume X% are Pro, Y% are Enterprise (if unlocked)
  let revenueToday = 0;
  const proUnlocked = product.monetizationTiers.pro;
  const entUnlocked = product.monetizationTiers.enterprise;
  // Default: if no Pro unlocked, no revenue. If Pro unlocked, 8% of users are Pro.
  // If Enterprise unlocked, 1% of users are Enterprise at much higher $/account.
  if (proUnlocked) {
    revenueToday += newUsers * 0.08 * (product.proPrice / 30); // daily revenue from Pro subscriptions
  }
  if (entUnlocked) {
    revenueToday += (newUsers * 0.01) * (product.enterprisePrice / 30);
  }
  revenueToday *= derived.revenueMult * companyRevenueMod;

  return {
    ...product,
    users: newUsers,
    gainedToday,
    churnedToday,
    revenueToday: Math.round(revenueToday),
    mrr: Math.round(revenueToday * 30),
    churnRate,
    overload,
    supportTickets: Math.max(0, product.supportTickets - Math.ceil(product.supportTickets * 0.2)), // natural decay
  };
}

// Support ticket generation + resolution
export function resolveSupportTickets(state: GameState): GameState {
  const supportStaff = state.staff.filter((e) => e.role === 'support_rep');
  const totalResolution = supportStaff.reduce((s, e) => s + e.skill * 0.5 * (1 + e.morale / 200), 0); // tickets/day per support rep

  const companySupportMod = activeModifiersFor(state, 'company', 'support');

  const products = state.products.map((p) => {
    if (p.status === 'pre_launch' || p.status === 'sunset') return p;
    // Aggregate support ticket reduction from shipped cards
    const ticketReductionMult = p.kanban
      .filter((c) => c.stage === 'shipped' && c.effect.supportTicketReduction)
      .reduce((mult, c) => mult * (1 - (c.effect.supportTicketReduction || 0)), 1);
    // Generate tickets proportional to user base + overload + bug risk of recent shipped cards
    const baseTickets = Math.ceil((p.users / 100) * 0.5);
    const overloadTickets = p.overload ? 10 : 0;
    const bugTickets = p.kanban
      .filter((c) => c.stage === 'shipped' && (state.day - (c.shippedDay ?? 0)) < 14)
      .reduce((s, c) => s + Math.ceil((c.bugRiskAtShip ?? 0) * 50), 0);
    const generated = Math.ceil((baseTickets + overloadTickets + bugTickets) * companySupportMod * ticketReductionMult);
    // Allocate resolution capacity proportionally to user share
    const totalUsers = state.products.reduce((s, x) => s + x.users, 0) || 1;
    const share = p.users / totalUsers;
    const resolved = Math.ceil(totalResolution * share);
    const newTickets = Math.max(0, p.supportTickets + generated - resolved);
    return { ...p, supportTickets: newTickets };
  });

  return { ...state, products };
}

// Company-wide daily expenses
export function dailyExpenses(state: GameState): { salaries: number; hosting: number; marketing: number; beta: number; database: number; total: number } {
  const salaries = state.staff.reduce((s, e) => s + e.salary / 30, 0)
    + (state.founder.hasSteppedBack ? 0 : 8000 / 30); // founder stipend
  let hosting = 0;
  let marketing = 0;
  let beta = 0;
  let database = 0;
  for (const p of state.products) {
    if (p.status === 'sunset') continue;
    hosting += getHostingPlan(p.hostingPlanId).costMonthly / 30;
    database += p.databaseCost / 30;
    marketing += p.marketing.spendDaily;
    // Beta tester daily costs
    for (const t of p.betaTesters) {
      if (t.active && t.daysRemaining > 0) beta += t.dailyCost;
    }
  }
  return { salaries: Math.round(salaries), hosting: Math.round(hosting), marketing: Math.round(marketing), beta: Math.round(beta), database: Math.round(database), total: Math.round(salaries + hosting + marketing + beta + database) };
}

// Morale drift for all employees
export function resolveMorale(state: GameState): GameState {
  const staff = state.staff.map((e) => {
    let morale = e.morale;
    // Workload: if assigned to a product with high support ticket load, morale drops
    const product = state.products.find((p) => p.id === e.assignedProductId);
    if (product && product.overload) morale -= 1.5;
    if (product && product.supportTickets > 100) morale -= 0.5;
    // Office quality: tiered
    const officeBoost: Record<string, number> = { garage: -0.3, loft: 0.1, floor: 0.4, tower: 0.8 };
    morale += officeBoost[state.officeTier] || 0;
    // Salary fairness: junior pays well relatively; if salary below level-average, morale drifts down
    const expectedSalary = (e.level === 'junior' ? 4000 : e.level === 'mid' ? 7000 : e.level === 'senior' ? 12000 : 18000) * 0.9;
    if (e.salary < expectedSalary * 0.85) morale -= 0.5;
    if (e.salary > expectedSalary * 1.2) morale += 0.3;
    // Random drift
    morale += (Math.random() - 0.5) * 0.5;
    // Founder-action morale boost
    if (state.moraleBoostUntilDay > state.day) morale += 1.0;
    // Tenure
    morale = Math.max(0, Math.min(100, morale));
    const history = [...e.moraleHistory, morale].slice(-30);
    return { ...e, morale: Math.round(morale * 10) / 10, tenureDays: e.tenureDays + 1, moraleHistory: history };
  });
  return { ...state, staff };
}

// Resignation: low-morale employees may quit
export function checkResignations(state: GameState): GameState {
  const remaining: Employee[] = [];
  const notifications = [...state.notifications];
  for (const e of state.staff) {
    if (e.morale < 25 && Math.random() < 0.05) {
      notifications.push({
        id: `notif_quit_${e.id}_${state.day}`,
        day: state.day,
        title: 'Employee Resigned',
        body: `${e.name} (${e.role}) has resigned due to low morale.`,
        type: 'bad',
        read: false,
      });
      continue; // skip
    }
    remaining.push(e);
  }
  return { ...state, staff: remaining, notifications };
}
