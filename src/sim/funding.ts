import type { GameState, FundingRound, Notification } from '../types';

// Generate a funding offer based on company traction
export function generateFundingOffer(state: GameState, roundNumber: number): FundingRound | null {
  if (roundNumber > 3) return null;
  const totalUsers = state.products.reduce((s, p) => s + p.users, 0);
  const totalMrr = state.products.reduce((s, p) => s + p.mrr, 0);

  const rounds = [
    { round: 1, minUsers: 200, cash: 500_000, equity: 15, target: { metric: 'users' as const, threshold: 2_000, deadlineDays: 120 } },
    { round: 2, minUsers: 5_000, cash: 3_000_000, equity: 18, target: { metric: 'users' as const, threshold: 30_000, deadlineDays: 180 } },
    { round: 3, minUsers: 50_000, cash: 15_000_000, equity: 20, target: { metric: 'mrr' as const, threshold: 200_000, deadlineDays: 240 } },
  ];
  const r = rounds[roundNumber - 1];
  if (!r) return null;
  if (totalUsers < r.minUsers) return null;

  return {
    roundNumber: r.round,
    cashRaised: r.cash,
    equityGiven: r.equity,
    growthTarget: {
      metric: r.target.metric,
      threshold: r.target.threshold,
      deadlineDay: state.day + r.target.deadlineDays,
    },
    investorConfidence: 75,
    acceptedDay: -1, // not yet accepted
  };
}

export function acceptFunding(state: GameState, offer: FundingRound): GameState {
  const accepted = { ...offer, acceptedDay: state.day };
  const notifications: Notification[] = [
    ...state.notifications,
    {
      id: `notif_funding_${state.day}`,
      day: state.day,
      title: `Series ${'ABC'[offer.roundNumber - 1]} Closed!`,
      body: `Raised $${(offer.cashRaised / 1_000_000).toFixed(1)}M at ${offer.equityGiven}% equity. Growth target: ${offer.growthTarget?.metric === 'users' ? `${offer.growthTarget.threshold.toLocaleString()} users` : `$${offer.growthTarget?.threshold.toLocaleString()}/mo MRR`} by day ${offer.growthTarget?.deadlineDay}.`,
      type: 'milestone',
      read: false,
    },
  ];
  return {
    ...state,
    cash: state.cash + offer.cashRaised,
    funding: [...state.funding, accepted],
    pendingFundingOffer: null,
    notifications,
  };
}

// Check funding milestones & investor confidence
export function checkFundingMilestones(state: GameState): GameState {
  if (state.funding.length === 0) return state;
  const latest = state.funding[state.funding.length - 1];
  if (!latest.growthTarget) return state;
  const totalUsers = state.products.reduce((s, p) => s + p.users, 0);
  const totalMrr = state.products.reduce((s, p) => s + p.mrr, 0);

  // If past deadline and target not met → confidence drop
  if (state.day > latest.growthTarget.deadlineDay) {
    const met = latest.growthTarget.metric === 'users'
      ? totalUsers >= latest.growthTarget.threshold
      : totalMrr >= latest.growthTarget.threshold;
    const updated = { ...latest, growthTarget: null };
    const funding = [...state.funding];
    funding[funding.length - 1] = met
      ? { ...updated, investorConfidence: Math.min(100, latest.investorConfidence + 10) }
      : { ...updated, investorConfidence: Math.max(0, latest.investorConfidence - 30) };
    return { ...state, funding };
  }
  // Slow drift: confidence drifts down slightly if target trajectory behind
  // Check progress vs time elapsed
  const elapsed = state.day - latest.acceptedDay;
  const total = latest.growthTarget.deadlineDay - latest.acceptedDay;
  const timeFrac = elapsed / total;
  const currentMetric = latest.growthTarget.metric === 'users' ? totalUsers : totalMrr;
  const progressFrac = currentMetric / latest.growthTarget.threshold;
  // If progress < time fraction * 0.7, drift down
  if (progressFrac < timeFrac * 0.7) {
    const funding = [...state.funding];
    funding[funding.length - 1] = { ...latest, investorConfidence: Math.max(0, latest.investorConfidence - 0.5) };
    return { ...state, funding };
  }
  return state;
}

// Generate new funding offer when previous round's milestone resolved and company grew enough
export function maybeOfferNextRound(state: GameState): GameState {
  if (state.pendingFundingOffer) return state;
  // If last funding round's growth target resolved (null), offer next round
  if (state.funding.length === 0) {
    // Series A: offer when first product shipped + has users
    const firstShipped = state.products.some((p) => p.launchDate !== null);
    if (firstShipped) {
      const offer = generateFundingOffer(state, 1);
      if (offer) return { ...state, pendingFundingOffer: offer };
    }
    return state;
  }
  const latest = state.funding[state.funding.length - 1];
  if (latest.growthTarget !== null) return state; // current round still has open target
  // Offer next round
  const offer = generateFundingOffer(state, latest.roundNumber + 1);
  if (offer) {
    return {
      ...state,
      pendingFundingOffer: offer,
      notifications: [
        ...state.notifications,
        {
          id: `notif_offer_${state.day}`,
          day: state.day,
          title: `Series ${'ABC'[offer.roundNumber - 1]} Offer Available`,
          body: `Investors are offering $${(offer.cashRaised / 1_000_000).toFixed(1)}M for ${offer.equityGiven}% equity. Review the term sheet in the Funding modal.`,
          type: 'info',
          read: false,
        },
      ],
    };
  }
  return state;
}

// Win/lose checks
export function checkWinLose(state: GameState): GameState {
  if (state.gameOverReason) return state;
  // Bankruptcy
  if (state.cash < 0) {
    return { ...state, gameOverReason: 'bankruptcy', isPaused: true };
  }
  // Investor takeover
  if (state.funding.length > 0) {
    const latest = state.funding[state.funding.length - 1];
    if (latest.investorConfidence <= 0) {
      return { ...state, gameOverReason: 'takeover', isPaused: true };
    }
  }
  // IPO: combined valuation crosses threshold sustained 30 days
  const totalUsers = state.products.reduce((s, p) => s + p.users, 0);
  const totalMrr = state.products.reduce((s, p) => s + p.mrr, 0);
  const valuation = totalUsers * 200 + totalMrr * 30; // simple valuation model
  if (valuation >= state.ipoTargetValuation) {
    const newSustained = state.ipoSustainedDays + 1;
    if (newSustained >= 30) {
      return { ...state, gameOverReason: 'ipo', isPaused: true, ipoSustainedDays: newSustained };
    }
    return { ...state, ipoSustainedDays: newSustained };
  }
  return { ...state, ipoSustainedDays: 0 };
}
