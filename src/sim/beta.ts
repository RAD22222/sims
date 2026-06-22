import type { GameState, Product, Bug, UserFeedback, Role } from '../types';
import { randomName, uid } from '../data/names';

const BUG_TEMPLATES: { title: string; severity: Bug['severity']; fixRole: Role; fixEffortDays: number }[] = [
  { title: 'Login button unresponsive on mobile', severity: 'high', fixRole: 'frontend', fixEffortDays: 2 },
  { title: 'API returns 500 on bulk upload', severity: 'critical', fixRole: 'backend', fixEffortDays: 3 },
  { title: 'Page crashes when clicking empty state', severity: 'medium', fixRole: 'frontend', fixEffortDays: 1 },
  { title: 'Email notifications not sending', severity: 'high', fixRole: 'backend', fixEffortDays: 2 },
  { title: 'Data not saving on form submit', severity: 'critical', fixRole: 'backend', fixEffortDays: 3 },
  { title: 'UI misaligned on tablet view', severity: 'low', fixRole: 'frontend', fixEffortDays: 1 },
  { title: 'Slow load time on dashboard', severity: 'medium', fixRole: 'backend', fixEffortDays: 2 },
  { title: 'Search returns wrong results', severity: 'medium', fixRole: 'backend', fixEffortDays: 2 },
  { title: 'Dark mode colors incorrect', severity: 'low', fixRole: 'frontend', fixEffortDays: 1 },
  { title: 'Websocket disconnects randomly', severity: 'high', fixRole: 'backend', fixEffortDays: 3 },
  { title: 'File upload fails for >10MB', severity: 'medium', fixRole: 'backend', fixEffortDays: 2 },
  { title: 'Calendar widget shows wrong date', severity: 'low', fixRole: 'frontend', fixEffortDays: 1 },
];

const FEEDBACK_TEMPLATES: { rating: 1 | 2 | 3 | 4 | 5; comment: string; category: UserFeedback['category'] }[] = [
  { rating: 5, comment: 'Love this product! Exactly what I needed.', category: 'praise' },
  { rating: 4, comment: 'Great tool, would love a dark mode.', category: 'feature_request' },
  { rating: 2, comment: 'Keeps crashing when I try to save. Frustrating.', category: 'bug' },
  { rating: 1, comment: 'Nothing works. Want a refund.', category: 'complaint' },
  { rating: 3, comment: 'Decent but missing key features like export.', category: 'feature_request' },
  { rating: 5, comment: 'Best SaaS I have used this year!', category: 'praise' },
  { rating: 3, comment: 'Good value but UI could be cleaner.', category: 'complaint' },
  { rating: 4, comment: 'Works well, support was helpful.', category: 'praise' },
  { rating: 2, comment: 'Too expensive for what it does.', category: 'complaint' },
  { rating: 4, comment: 'Would recommend API access for power users.', category: 'feature_request' },
  { rating: 1, comment: 'Lost my data after the last update.', category: 'bug' },
  { rating: 5, comment: 'Onboarding was super smooth!', category: 'praise' },
];

// Resolve beta testing: testers find bugs, decrement days remaining, expire when done
export function resolveBetaTesting(state: GameState): GameState {
  const products = state.products.map((p) => {
    if (p.status !== 'beta') return p;

    let bugs = [...p.bugs];
    let betaTesters = p.betaTesters.map((t) => ({ ...t }));

    // Each active tester has a chance to find bugs per day
    for (const tester of betaTesters) {
      if (!tester.active || tester.daysRemaining <= 0) continue;
      // Find chance: skill% per day, find 0-2 bugs
      const findChance = tester.skill / 100;
      if (Math.random() < findChance) {
        const numBugs = Math.random() < 0.3 ? 2 : 1;
        for (let i = 0; i < numBugs; i++) {
          const template = BUG_TEMPLATES[Math.floor(Math.random() * BUG_TEMPLATES.length)];
          // Avoid duplicate bug titles
          if (bugs.some((b) => b.title === template.title && b.status !== 'fixed')) continue;
          const newBug: Bug = {
            id: uid('bug'),
            title: template.title,
            severity: template.severity,
            status: 'open',
            foundDay: state.day,
            foundBy: 'beta_tester',
            fixRole: template.fixRole,
            fixEffortDays: template.fixEffortDays,
            progressDays: 0,
            assignedEmployeeIds: [],
          };
          bugs.push(newBug);
          tester.bugsFound += 1;
        }
      }
      tester.daysRemaining -= 1;
      if (tester.daysRemaining <= 0) tester.active = false;
    }

    // Auto-fix in_progress bugs (advance progress)
    const teamEmployees = state.staff.filter((e) => e.assignedProductId === p.id);
    bugs = bugs.map((b) => {
      if (b.status !== 'in_progress') return b;
      const assigned = teamEmployees.filter((e) => b.assignedEmployeeIds.includes(e.id));
      const output = assigned.reduce((s, e) => s + 0.5 + e.skill / 100, 0);
      const newProgress = b.progressDays + output;
      if (newProgress >= b.fixEffortDays) {
        return { ...b, status: 'fixed', progressDays: b.fixEffortDays };
      }
      return { ...b, progressDays: newProgress };
    });

    return { ...p, bugs, betaTesters };
  });

  return { ...state, products };
}

// Resolve QA feedback: generate developer + customer feedback during QA phase
export function resolveQAFeedback(state: GameState): GameState {
  const products = state.products.map((p) => {
    if (p.status !== 'qa') return p;

    let feedback = [...p.feedback];
    // ~20% chance per day to get new feedback during QA
    if (Math.random() < 0.2) {
      const template = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];
      const newFeedback: UserFeedback = {
        id: uid('fb'),
        day: state.day,
        userName: randomName(),
        rating: template.rating,
        comment: template.comment,
        category: template.category,
        status: 'new',
      };
      feedback.push(newFeedback);
    }

    return { ...p, feedback };
  });

  return { ...state, products };
}

// Resolve live product feedback + ratings
export function resolveLiveFeedback(state: GameState): GameState {
  const products = state.products.map((p) => {
    if (p.status !== 'live' && p.status !== 'scaling') return p;

    let feedback = [...p.feedback];
    // ~10% chance per day per 100 users to get feedback
    const feedbackChance = Math.min(0.5, p.users / 1000);
    if (Math.random() < feedbackChance) {
      const template = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];
      const newFeedback: UserFeedback = {
        id: uid('fb'),
        day: state.day,
        userName: randomName(),
        rating: template.rating,
        comment: template.comment,
        category: template.category,
        status: 'new',
      };
      feedback.push(newFeedback);
    }
    // Keep only last 100 feedback items
    feedback = feedback.slice(-100);

    // Recompute avg rating
    const recentRatings = feedback.slice(-50).map((f) => f.rating);
    const avgRating = recentRatings.length > 0 ? recentRatings.reduce((s, r) => s + r, 0) / recentRatings.length : 0;
    const totalRatings = p.totalRatings + (Math.random() < 0.3 ? 1 : 0);

    return { ...p, feedback, avgRating: Math.round(avgRating * 10) / 10, totalRatings };
  });

  return { ...state, products };
}

// Resolve live bugs: small chance per day for live products to discover new bugs from users
export function resolveLiveBugs(state: GameState): GameState {
  const products = state.products.map((p) => {
    if (p.status !== 'live' && p.status !== 'scaling') return p;

    let bugs = [...p.bugs];
    // Chance proportional to user base (more users = more bug reports)
    const bugChance = Math.min(0.3, p.users / 5000);
    if (Math.random() < bugChance) {
      const template = BUG_TEMPLATES[Math.floor(Math.random() * BUG_TEMPLATES.length)];
      if (!bugs.some((b) => b.title === template.title && b.status !== 'fixed')) {
        bugs.push({
          id: uid('bug'),
          title: template.title,
          severity: template.severity,
          status: 'open',
          foundDay: state.day,
          foundBy: 'customer',
          fixRole: template.fixRole,
          fixEffortDays: template.fixEffortDays,
          progressDays: 0,
          assignedEmployeeIds: [],
        });
      }
    }

    // Auto-fix in_progress bugs
    const teamEmployees = state.staff.filter((e) => e.assignedProductId === p.id);
    bugs = bugs.map((b) => {
      if (b.status !== 'in_progress') return b;
      const assigned = teamEmployees.filter((e) => b.assignedEmployeeIds.includes(e.id));
      const output = assigned.reduce((s, e) => s + 0.5 + e.skill / 100, 0);
      const newProgress = b.progressDays + output;
      if (newProgress >= b.fixEffortDays) {
        return { ...b, status: 'fixed', progressDays: b.fixEffortDays };
      }
      return { ...b, progressDays: newProgress };
    });

    return { ...p, bugs };
  });

  return { ...state, products };
}
