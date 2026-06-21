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

export const OS_CATALOG: FeatureCard[] = [
  card(
    'os_mvp',
    'OS Kernel MVP',
    'core',
    [
      { role: 'backend', effortDays: 30 },
      { role: 'frontend', effortDays: 15 },
      { role: 'ui_ux', effortDays: 10 },
      { role: 'devops', effortDays: 10 },
    ],
    50000,
    [],
    { productScoreDelta: 25, isMvp: true },
    65,
  ),
  card(
    'os_driver_layer',
    'Hardware Driver Layer',
    'core',
    [
      { role: 'backend', effortDays: 25 },
      { role: 'devops', effortDays: 10 },
    ],
    40000,
    ['os_mvp'],
    { productScoreDelta: 10 },
  ),
  card(
    'os_app_store',
    'App Store + SDK',
    'monetization',
    [
      { role: 'backend', effortDays: 20 },
      { role: 'frontend', effortDays: 10 },
    ],
    30000,
    ['os_mvp'],
    { revenuePerUserMult: 1.4, growthMult: 1.3 },
  ),
  card(
    'os_developer_tools',
    'Developer Tools & IDE',
    'growth',
    [
      { role: 'backend', effortDays: 15 },
      { role: 'frontend', effortDays: 10 },
    ],
    25000,
    ['os_app_store'],
    { growthMult: 1.4 },
  ),
  card(
    'os_security_hardening',
    'Security Hardening',
    'compliance',
    [
      { role: 'devops', effortDays: 15 },
      { role: 'backend', effortDays: 10 },
    ],
    30000,
    ['os_mvp'],
    { churnMult: 0.85, productScoreDelta: 5 },
  ),
];

export const OS_STARTER_UNLOCKED: string[] = [];
