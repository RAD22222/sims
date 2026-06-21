import type { FeatureCard, CardStage } from '../../types';

function card(
  id: string,
  name: string,
  category: FeatureCard['category'],
  requiredRoles: { role: FeatureCard['requiredRoles'][0]['role']; effortDays: number }[],
  cost: number,
  prereqCardIds: string[],
  effect: FeatureCard['effect'],
  totalEffortDays?: number,
): FeatureCard {
  const computedTotal = requiredRoles.reduce((s, r) => s + r.effortDays, 0);
  return {
    id,
    name,
    category,
    requiredRoles,
    cost,
    prereqCardIds,
    effect,
    stage: 'locked' as CardStage,
    assignedEmployeeIds: [],
    progressDays: 0,
    totalEffortDays: totalEffortDays ?? computedTotal,
  };
}

export const MOBILE_CATALOG: FeatureCard[] = [
  card(
    'mob_mvp',
    'MVP / Prototype',
    'core',
    [
      { role: 'mobile', effortDays: 10 },
      { role: 'ui_ux', effortDays: 6 },
    ],
    5000,
    [],
    { productScoreDelta: 20, isMvp: true },
    16,
  ),
  // Core
  card(
    'mob_onboarding',
    'Onboarding / Tutorial Flow',
    'core',
    [
      { role: 'mobile', effortDays: 4 },
      { role: 'ui_ux', effortDays: 3 },
    ],
    3000,
    [],
    { churnMult: 0.85, productScoreDelta: 3 },
  ),
  card(
    'mob_push',
    'Push Notifications',
    'core',
    [{ role: 'mobile', effortDays: 4 }],
    3500,
    [],
    { churnMult: 0.9, customEffect: 'Re-engagement boost' },
  ),
  card(
    'mob_offline',
    'Offline Mode',
    'core',
    [{ role: 'mobile', effortDays: 6 }],
    5000,
    [],
    { productScoreDelta: 4, churnMult: 0.95 },
  ),
  // Monetization
  card(
    'mob_iap',
    'In-App Purchases',
    'monetization',
    [{ role: 'mobile', effortDays: 5 }],
    4000,
    [],
    { revenuePerUserMult: 1.3, customEffect: 'IAP revenue unlocked' },
  ),
  card(
    'mob_subscription',
    'Subscription Tier',
    'monetization',
    [{ role: 'mobile', effortDays: 5 }],
    4500,
    ['mob_iap'],
    { unlocksMonetizationTier: 'pro', revenuePerUserMult: 1.2 },
  ),
  card(
    'mob_rewarded_ads',
    'Rewarded Ads',
    'monetization',
    [{ role: 'mobile', effortDays: 3 }],
    2500,
    [],
    { revenuePerUserMult: 1.1, customEffect: 'Low-friction ad revenue' },
  ),
  // Growth
  card(
    'mob_aso',
    'App Store Optimization',
    'growth',
    [{ role: 'growth_marketer', effortDays: 5 }],
    2000,
    [],
    { growthMult: 1.2, customEffect: 'Organic installs boost' },
  ),
  card(
    'mob_referral',
    'Referral / Invite System',
    'growth',
    [{ role: 'mobile', effortDays: 4 }],
    3500,
    [],
    { growthMult: 1.15 },
  ),
  card(
    'mob_social',
    'Social Sharing Hooks',
    'growth',
    [
      { role: 'mobile', effortDays: 4 },
      { role: 'ui_ux', effortDays: 2 },
    ],
    3500,
    [],
    { growthMult: 1.12 },
  ),
  // Retention
  card(
    'mob_streaks',
    'Daily Streaks / Engagement Loop',
    'retention',
    [
      { role: 'mobile', effortDays: 5 },
      { role: 'ui_ux', effortDays: 3 },
    ],
    5000,
    [],
    { churnMult: 0.8, customEffect: 'Daily active users surge' },
  ),
  card(
    'mob_personalization',
    'Personalization Engine',
    'retention',
    [{ role: 'mobile', effortDays: 7 }],
    7000,
    [],
    { churnMult: 0.85, productScoreDelta: 3 },
  ),
  // Compliance/Infra
  card(
    'mob_ios_port',
    'iOS Port',
    'compliance',
    [{ role: 'mobile', effortDays: 14 }],
    18000,
    [],
    { growthMult: 1.8, customEffect: 'Unlocks iOS App Store — large addressable boost' },
  ),
  card(
    'mob_crash_reporting',
    'Crash Reporting & Stability',
    'infra',
    [
      { role: 'mobile', effortDays: 4 },
      { role: 'devops', effortDays: 2 },
    ],
    4000,
    [],
    { churnMult: 0.9, supportTicketReduction: 0.3, customEffect: 'Prereq for store featuring' },
  ),
  card(
    'mob_featuring',
    'App Store Featuring Eligibility',
    'growth',
    [{ role: 'mobile', effortDays: 2 }],
    0,
    ['mob_crash_reporting'],
    { growthMult: 1.5, customEffect: 'One-time large install spike eligibility' },
  ),
  // Polish
  card(
    'mob_ui_redesign',
    'UI Redesign 2.0',
    'polish',
    [{ role: 'ui_ux', effortDays: 6 }],
    5000,
    [],
    { productScoreDelta: 6, churnMult: 0.93 },
  ),
  card(
    'mob_a11y',
    'Accessibility Pass',
    'polish',
    [{ role: 'ui_ux', effortDays: 3 }],
    2500,
    [],
    { growthMult: 1.05, productScoreDelta: 2 },
  ),
];

export const MOBILE_STARTER_UNLOCKED = ['mob_onboarding', 'mob_push'];
