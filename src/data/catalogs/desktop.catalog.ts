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

export const DESKTOP_CATALOG: FeatureCard[] = [
  card(
    'desk_mvp',
    'MVP / Prototype',
    'core',
    [
      { role: 'frontend', effortDays: 10 },
      { role: 'ui_ux', effortDays: 6 },
    ],
    5000,
    [],
    { productScoreDelta: 20, isMvp: true },
    16,
  ),
  // Core
  card(
    'desk_autoupdater',
    'Auto-Updater',
    'core',
    [
      { role: 'backend', effortDays: 4 },
      { role: 'frontend', effortDays: 3 },
    ],
    3500,
    [],
    { supportTicketReduction: 0.25, productScoreDelta: 2 },
  ),
  card(
    'desk_plugin_system',
    'Plugin / Extension System',
    'core',
    [{ role: 'backend', effortDays: 8 }],
    8000,
    [],
    { churnMult: 0.85, growthMult: 1.1, customEffect: 'Power-user retention + ecosystem growth' },
  ),
  card(
    'desk_mac_port',
    'Cross-Platform Port (Mac)',
    'core',
    [{ role: 'frontend', effortDays: 10 }],
    10000,
    [],
    { growthMult: 1.5, customEffect: 'Unlocks Mac market' },
  ),
  // Monetization
  card(
    'desk_license_key',
    'One-Time License Key',
    'monetization',
    [{ role: 'backend', effortDays: 4 }],
    3000,
    [],
    { revenuePerUserMult: 1.4, customEffect: 'Unlocks paid unlock model' },
  ),
  card(
    'desk_subscription',
    'Subscription / Maintenance Plan',
    'monetization',
    [{ role: 'backend', effortDays: 5 }],
    4500,
    [],
    { unlocksMonetizationTier: 'pro', revenuePerUserMult: 1.2 },
  ),
  card(
    'desk_site_license',
    'Enterprise Site License',
    'monetization',
    [
      { role: 'backend', effortDays: 6 },
      { role: 'sales_rep', effortDays: 4 },
    ],
    9000,
    ['desk_license_key'],
    { unlocksMonetizationTier: 'enterprise', revenuePerUserMult: 1.6 },
  ),
  // Growth
  card(
    'desk_free_trial',
    'Free Trial Mode',
    'growth',
    [{ role: 'frontend', effortDays: 3 }],
    2500,
    [],
    { growthMult: 1.15, customEffect: 'Trial → purchase conversion' },
  ),
  card(
    'desk_press_kit',
    'Word-of-Mouth / Press Kit',
    'growth',
    [{ role: 'content_marketer', effortDays: 5 }],
    2000,
    [],
    { growthMult: 1.1, customEffect: 'Press pickup chance' },
  ),
  // Retention
  card(
    'desk_cloud_sync',
    'Cloud Sync',
    'retention',
    [
      { role: 'backend', effortDays: 6 },
      { role: 'devops', effortDays: 3 },
    ],
    6000,
    [],
    { churnMult: 0.85, productScoreDelta: 3, customEffect: 'Cross-device stickiness' },
  ),
  card(
    'desk_template_library',
    'Template / Asset Library',
    'retention',
    [{ role: 'ui_ux', effortDays: 5 }],
    4000,
    [],
    { churnMult: 0.9, customEffect: 'Built-in content retention' },
  ),
  // Compliance/Infra
  card(
    'desk_code_signing',
    'Code Signing & Notarization',
    'compliance',
    [{ role: 'devops', effortDays: 3 }],
    4000,
    [],
    { growthMult: 1.1, customEffect: 'Passes OS trust checks, less install friction' },
  ),
  card(
    'desk_crash_telemetry',
    'Crash Reporting & Telemetry',
    'infra',
    [{ role: 'devops', effortDays: 4 }],
    3500,
    [],
    { churnMult: 0.9, supportTicketReduction: 0.3 },
  ),
  // Polish
  card(
    'desk_ui_redesign',
    'UI Redesign 2.0',
    'polish',
    [{ role: 'ui_ux', effortDays: 6 }],
    5000,
    [],
    { productScoreDelta: 6, churnMult: 0.93 },
  ),
  card(
    'desk_dark_mode',
    'Dark Mode',
    'polish',
    [{ role: 'frontend', effortDays: 2 }],
    1000,
    [],
    { productScoreDelta: 1, churnMult: 0.99 },
  ),
];

export const DESKTOP_STARTER_UNLOCKED = ['desk_autoupdater', 'desk_dark_mode'];
