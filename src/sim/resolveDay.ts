import type { GameState } from '../types';
import { maybeSpawnEvent, expireEvents } from './events';
import { advanceKanban, recomputeProductFromShipped } from './kanban';
import { resolveSupportTickets, resolveProductEconomy, dailyExpenses, resolveMorale, checkResignations } from './economy';
import { checkFundingMilestones, maybeOfferNextRound, checkWinLose } from './funding';
import { getHostingPlan } from '../data/catalogs/hosting';

// Pure function: resolve one in-game day, returning new state. No side effects.
export function resolveDay(prev: GameState): GameState {
  let state: GameState = { ...prev, day: prev.day + 1 };

  // 1. Expire old events, then maybe spawn new ones
  state = expireEvents(state);
  state = maybeSpawnEvent(state);

  // Capture pre-kanban product launch state for diff detection
  const prevLaunchStatus = new Map(prev.products.map((p) => [p.id, p.status]));

  // 2. Advance kanban cards (work from assigned staff)
  state = advanceKanban(state);

  // 2b. Notify about newly-launched products
  const newLaunches = state.products.filter(
    (p) => prevLaunchStatus.get(p.id) === 'pre_launch' && p.status === 'live'
  );
  if (newLaunches.length > 0) {
    state = {
      ...state,
      notifications: [
        ...state.notifications,
        ...newLaunches.map((p) => ({
          id: `notif_launch_${p.id}_${state.day}`,
          day: state.day,
          title: '🚀 Product Launched!',
          body: `${p.name} has shipped its MVP and is now live. Marketing will start acquiring users.`,
          type: 'milestone' as const,
          read: false,
        })),
      ],
    };
  }

  // 3. Resolve support tickets (generation + resolution)
  state = resolveSupportTickets(state);

  // 4. Compute per-product economy (users/churn/revenue) and apply
  state = {
    ...state,
    products: state.products.map((p) => resolveProductEconomy(p, state)),
  };

  // 5. Compute employee morale drift + resignation checks
  state = resolveMorale(state);
  state = checkResignations(state);

  // 6. Compute daily revenue (sum across products)
  const totalRevenueToday = state.products.reduce((s, p) => s + p.revenueToday, 0);
  state.totalRevenueAllTime += totalRevenueToday;

  // 7. Compute daily expenses
  const expenses = dailyExpenses(state);

  // 8. Apply net profit/loss to shared cash pool
  state.cash = state.cash + totalRevenueToday - expenses.total;

  // 9. Push to history
  const totalUsers = state.products.reduce((s, p) => s + p.users, 0);
  const totalMrr = state.products.reduce((s, p) => s + p.mrr, 0);
  state.history = [
    ...state.history,
    { day: state.day, totalUsers, cash: state.cash, mrr: totalMrr },
  ].slice(-365);

  // 10. Check funding milestones + offer next round
  state = checkFundingMilestones(state);
  state = maybeOfferNextRound(state);

  // 11. Office tier transitions based on total company headcount
  const headcount = state.staff.length + (state.founder.hasSteppedBack ? 0 : 1);
  const newTier = headcount >= 40 ? 'tower' : headcount >= 18 ? 'floor' : headcount >= 6 ? 'loft' : 'garage';
  if (newTier !== state.officeTier) {
    state = {
      ...state,
      officeTier: newTier,
      notifications: [
        ...state.notifications,
        {
          id: `notif_office_${state.day}`,
          day: state.day,
          title: 'Office Upgraded!',
          body: `You've moved into a new ${newTier === 'loft' ? 'Open-Plan Loft' : newTier === 'floor' ? 'Full Floor' : 'Tower'} office. Team morale gets a permanent boost.`,
          type: 'milestone',
          read: false,
        },
      ],
    };
  }

  // 12. Check win/lose conditions
  state = checkWinLose(state);

  return state;
}
