import type { GameEvent, EventModifier } from '../types';

export interface EventTemplate {
  id: string;
  title: string;
  description: string;
  type: 'good' | 'bad' | 'info';
  weight: number;
  durationDays: number;
  minDay: number;
  maxDay?: number;
  requiresProducts?: number;
  modifiers?: Omit<EventModifier, 'target'>[];
  applyTo?: 'company' | 'randomProduct' | 'allProducts';
  notification: { title: string; body: string; type: 'good' | 'bad' | 'info' | 'milestone' };
}

export const EVENT_POOL: EventTemplate[] = [
  {
    id: 'viral_tweet',
    title: 'Viral Tweet',
    description: 'A power user tweeted about your product — installs are spiking!',
    type: 'good',
    weight: 6,
    durationDays: 5,
    minDay: 5,
    modifiers: [{ kind: 'growth', mult: 2.2 }],
    applyTo: 'randomProduct',
    notification: { title: 'Virality!', body: 'A tweet about your product went viral — growth surges for 5 days.', type: 'good' },
  },
  {
    id: 'competitor_launch',
    title: 'Competitor Launches',
    description: 'A well-funded competitor just launched a similar product.',
    type: 'bad',
    weight: 5,
    durationDays: 12,
    minDay: 30,
    modifiers: [{ kind: 'growth', mult: 0.7 }, { kind: 'churn', mult: 1.3 }],
    applyTo: 'allProducts',
    notification: { title: 'New Competitor', body: 'A competitor entered the market. Growth slows, churn rises for 12 days.', type: 'bad' },
  },
  {
    id: 'press_coverage',
    title: 'Press Coverage',
    description: 'TechCrunch published a positive review.',
    type: 'good',
    weight: 4,
    durationDays: 8,
    minDay: 10,
    modifiers: [{ kind: 'growth', mult: 1.6 }],
    applyTo: 'company',
    notification: { title: 'Press Hit', body: 'Great press coverage is boosting growth across all products.', type: 'good' },
  },
  {
    id: 'aws_outage',
    title: 'Cloud Outage',
    description: 'Your cloud provider had a multi-hour outage.',
    type: 'bad',
    weight: 4,
    durationDays: 3,
    minDay: 20,
    modifiers: [{ kind: 'churn', mult: 1.8 }, { kind: 'support', mult: 2.5 }],
    applyTo: 'randomProduct',
    notification: { title: 'Cloud Outage', body: 'A cloud outage hit one of your products. Support tickets spike, churn rises briefly.', type: 'bad' },
  },
  {
    id: 'security_breach',
    title: 'Security Incident',
    description: 'A minor security incident was disclosed.',
    type: 'bad',
    weight: 3,
    durationDays: 14,
    minDay: 40,
    requiresProducts: 1,
    modifiers: [{ kind: 'churn', mult: 1.5 }, { kind: 'morale', mult: 0.9 }],
    applyTo: 'randomProduct',
    notification: { title: 'Security Incident', body: 'A breach disclosure is hurting trust. Churn rises for 14 days; team morale dips.', type: 'bad' },
  },
  {
    id: 'holiday_season',
    title: 'Holiday Season',
    description: 'Seasonal traffic is up — but so are support tickets.',
    type: 'info',
    weight: 5,
    durationDays: 14,
    minDay: 1,
    modifiers: [{ kind: 'growth', mult: 1.3 }, { kind: 'support', mult: 1.6 }],
    applyTo: 'company',
    notification: { title: 'Holiday Season', body: 'Seasonal lift: growth +30%, support load +60% for 14 days.', type: 'info' },
  },
  {
    id: 'great_hire_morale',
    title: 'Team Offsite',
    description: 'The team just had a great offsite — morale is high.',
    type: 'good',
    weight: 4,
    durationDays: 10,
    minDay: 10,
    modifiers: [{ kind: 'morale', mult: 1.15 }],
    applyTo: 'company',
    notification: { title: 'Great Offsite', body: 'Team morale is soaring after the offsite — +15% productivity for 10 days.', type: 'good' },
  },
  {
    id: 'market_downturn',
    title: 'Market Downturn',
    description: 'Macroeconomic fears are making enterprises cautious.',
    type: 'bad',
    weight: 3,
    durationDays: 20,
    minDay: 60,
    modifiers: [{ kind: 'revenue', mult: 0.85 }, { kind: 'growth', mult: 0.85 }],
    applyTo: 'company',
    notification: { title: 'Market Downturn', body: 'Enterprise spending is softening. Revenue and growth dip for 20 days.', type: 'bad' },
  },
  {
    id: 'feature_win',
    title: 'Feature Win',
    description: 'A shipped feature landed particularly well with users.',
    type: 'good',
    weight: 4,
    durationDays: 7,
    minDay: 15,
    requiresProducts: 1,
    modifiers: [{ kind: 'growth', mult: 1.4 }, { kind: 'churn', mult: 0.8 }],
    applyTo: 'randomProduct',
    notification: { title: 'Feature Hit', body: 'A recent feature is resonating strongly with users — growth +40%, churn -20% for 7 days.', type: 'good' },
  },
  {
    id: 'burnout_wave',
    title: 'Burnout Wave',
    description: 'Crunch is catching up with the team.',
    type: 'bad',
    weight: 3,
    durationDays: 8,
    minDay: 25,
    requiresProducts: 1,
    modifiers: [{ kind: 'morale', mult: 0.85 }],
    applyTo: 'company',
    notification: { title: 'Burnout Warning', body: 'Team morale is dropping from sustained crunch — productivity -15% for 8 days.', type: 'bad' },
  },
];

export function pickEvent(day: number, numProducts: number, rng: () => number = Math.random): EventTemplate | null {
  const eligible = EVENT_POOL.filter(
    (e) => day >= e.minDay && (e.maxDay === undefined || day <= e.maxDay) && (e.requiresProducts === undefined || numProducts >= e.requiresProducts)
  );
  if (eligible.length === 0) return null;
  const totalWeight = eligible.reduce((s, e) => s + e.weight, 0);
  let r = rng() * totalWeight;
  for (const e of eligible) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return eligible[eligible.length - 1];
}

export function eventToGameEvent(template: EventTemplate, day: number, productId: string | 'company'): GameEvent {
  const target = template.applyTo === 'company' ? 'company' : productId;
  return {
    id: `${template.id}_${day}_${Math.floor(Math.random() * 10000)}`,
    day,
    title: template.title,
    description: template.description,
    type: template.type,
    durationDays: template.durationDays,
    modifiers: template.modifiers?.map((m) => ({ ...m, target })),
  };
}
