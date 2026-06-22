import type { SaasTemplate, FeatureCard, CardCategory, Role } from '../../types';

export interface SaasTemplateDef {
  id: SaasTemplate;
  label: string;
  icon: string;
  description: string;
  // Starter features the user can pick from during product creation
  starterFeatures: { id: string; name: string; description: string; roles: Role[]; effortDays: number; cost: number; effect: FeatureCard['effect'] }[];
  // Suggested day-based feature roadmap (unlocks over time)
  roadmap: { day: number; name: string; description: string; category: CardCategory; roles: { role: Role; effortDays: number }[]; cost: number; effect: FeatureCard['effect'] }[];
}

export const SAAS_TEMPLATES: SaasTemplateDef[] = [
  {
    id: 'project_mgmt',
    label: 'Project Management Tool',
    icon: '📋',
    description: 'Kanban boards, task tracking, team collaboration. Like Trello or Asana.',
    starterFeatures: [
      {
        id: 'pm_kanban',
        name: 'Kanban Board',
        description: 'Drag-and-drop task columns (To Do / Doing / Done)',
        roles: ['frontend', 'backend'],
        effortDays: 5,
        cost: 3000,
        effect: { productScoreDelta: 8, churnMult: 0.95 },
      },
      {
        id: 'pm_tasks',
        name: 'Task Assignment',
        description: 'Assign tasks to team members with due dates',
        roles: ['backend', 'frontend'],
        effortDays: 4,
        cost: 2500,
        effect: { productScoreDelta: 5, churnMult: 0.97 },
      },
      {
        id: 'pm_teams',
        name: 'Team Workspaces',
        description: 'Multiple project boards per team',
        roles: ['backend'],
        effortDays: 6,
        cost: 4000,
        effect: { revenuePerUserMult: 1.2, growthMult: 1.1 },
      },
    ],
    roadmap: [
      { day: 5, name: 'Comments & Activity Feed', description: 'Comment on tasks, see activity log', category: 'core', roles: [{ role: 'backend', effortDays: 4 }, { role: 'frontend', effortDays: 3 }], cost: 3000, effect: { productScoreDelta: 4, churnMult: 0.95 } },
      { day: 10, name: 'File Attachments', description: 'Upload files to tasks', category: 'core', roles: [{ role: 'backend', effortDays: 5 }], cost: 3500, effect: { productScoreDelta: 3 } },
      { day: 15, name: 'Gantt Charts', description: 'Timeline view of tasks', category: 'core', roles: [{ role: 'frontend', effortDays: 7 }], cost: 5000, effect: { productScoreDelta: 6, revenuePerUserMult: 1.15 } },
      { day: 20, name: 'Pro Tier (Subscriptions)', description: 'Paid plan with unlimited boards', category: 'monetization', roles: [{ role: 'backend', effortDays: 5 }], cost: 4000, effect: { unlocksMonetizationTier: 'pro' } },
      { day: 30, name: 'Slack Integration', description: 'Send notifications to Slack', category: 'growth', roles: [{ role: 'backend', effortDays: 4 }], cost: 3000, effect: { growthMult: 1.15 } },
    ],
  },
  {
    id: 'crm',
    label: 'CRM (Customer Relationship)',
    icon: '🤝',
    description: 'Contact management, sales pipeline, email tracking. Like HubSpot.',
    starterFeatures: [
      {
        id: 'crm_contacts',
        name: 'Contact Management',
        description: 'Store and organize customer contacts',
        roles: ['backend', 'frontend'],
        effortDays: 5,
        cost: 3000,
        effect: { productScoreDelta: 7, churnMult: 0.96 },
      },
      {
        id: 'crm_pipeline',
        name: 'Sales Pipeline',
        description: 'Visual deal stages (Lead → Qualified → Won)',
        roles: ['frontend', 'backend'],
        effortDays: 6,
        cost: 4000,
        effect: { productScoreDelta: 6, revenuePerUserMult: 1.15 },
      },
      {
        id: 'crm_email',
        name: 'Email Tracking',
        description: 'Track email opens and clicks',
        roles: ['backend'],
        effortDays: 4,
        cost: 3000,
        effect: { productScoreDelta: 4, growthMult: 1.08 },
      },
    ],
    roadmap: [
      { day: 5, name: 'Deal Analytics', description: 'Win/loss analytics dashboard', category: 'core', roles: [{ role: 'frontend', effortDays: 5 }, { role: 'backend', effortDays: 4 }], cost: 4000, effect: { productScoreDelta: 5 } },
      { day: 10, name: 'Email Templates', description: 'Reusable email templates with merge fields', category: 'retention', roles: [{ role: 'frontend', effortDays: 3 }, { role: 'backend', effortDays: 4 }], cost: 3000, effect: { churnMult: 0.95 } },
      { day: 15, name: 'Pro Tier (Subscriptions)', description: 'Paid plan with advanced pipeline', category: 'monetization', roles: [{ role: 'backend', effortDays: 5 }], cost: 4000, effect: { unlocksMonetizationTier: 'pro' } },
      { day: 20, name: 'Meeting Scheduler', description: 'Book meetings from CRM', category: 'core', roles: [{ role: 'frontend', effortDays: 5 }, { role: 'backend', effortDays: 5 }], cost: 5000, effect: { productScoreDelta: 5, revenuePerUserMult: 1.1 } },
      { day: 30, name: 'Enterprise SSO', description: 'Single sign-on for enterprise', category: 'compliance', roles: [{ role: 'backend', effortDays: 8 }], cost: 12000, effect: { unlocksMonetizationTier: 'enterprise' } },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics Dashboard',
    icon: '📊',
    description: 'Event tracking, funnels, retention charts. Like Mixpanel or Amplitude.',
    starterFeatures: [
      {
        id: 'an_events',
        name: 'Event Tracking',
        description: 'Track custom user events',
        roles: ['backend'],
        effortDays: 5,
        cost: 3500,
        effect: { productScoreDelta: 8, churnMult: 0.95 },
      },
      {
        id: 'an_dashboard',
        name: 'Real-time Dashboard',
        description: 'Live charts of user activity',
        roles: ['frontend', 'backend'],
        effortDays: 6,
        cost: 4000,
        effect: { productScoreDelta: 6, growthMult: 1.1 },
      },
      {
        id: 'an_funnels',
        name: 'Funnel Analysis',
        description: 'Track conversion through steps',
        roles: ['frontend', 'backend'],
        effortDays: 5,
        cost: 3500,
        effect: { productScoreDelta: 5, revenuePerUserMult: 1.1 },
      },
    ],
    roadmap: [
      { day: 5, name: 'Retention Cohorts', description: 'Cohort retention analysis', category: 'core', roles: [{ role: 'frontend', effortDays: 6 }], cost: 4000, effect: { productScoreDelta: 5 } },
      { day: 10, name: 'A/B Testing', description: 'Split test features', category: 'core', roles: [{ role: 'backend', effortDays: 6 }], cost: 5000, effect: { productScoreDelta: 4, growthMult: 1.08 } },
      { day: 15, name: 'Pro Tier', description: 'Paid plan with advanced metrics', category: 'monetization', roles: [{ role: 'backend', effortDays: 5 }], cost: 4000, effect: { unlocksMonetizationTier: 'pro' } },
      { day: 20, name: 'Alert System', description: 'Email/Slack alerts on metric changes', category: 'retention', roles: [{ role: 'backend', effortDays: 4 }], cost: 3000, effect: { churnMult: 0.93 } },
      { day: 30, name: 'Data Export API', description: 'Export raw data via API', category: 'growth', roles: [{ role: 'backend', effortDays: 6 }], cost: 5000, effect: { growthMult: 1.15 } },
    ],
  },
  {
    id: 'comms',
    label: 'Communication Tool',
    icon: '💬',
    description: 'Team chat, channels, file sharing. Like Slack or Discord.',
    starterFeatures: [
      {
        id: 'cm_channels',
        name: 'Channels & DMs',
        description: 'Topic channels + direct messages',
        roles: ['frontend', 'backend'],
        effortDays: 6,
        cost: 4000,
        effect: { productScoreDelta: 8, churnMult: 0.93 },
      },
      {
        id: 'cm_realtime',
        name: 'Real-time Messaging',
        description: 'Instant message delivery via WebSocket',
        roles: ['backend'],
        effortDays: 5,
        cost: 3500,
        effect: { productScoreDelta: 5, churnMult: 0.95 },
      },
      {
        id: 'cm_files',
        name: 'File Sharing',
        description: 'Upload and preview files in chat',
        roles: ['backend', 'frontend'],
        effortDays: 4,
        cost: 3000,
        effect: { productScoreDelta: 4, growthMult: 1.08 },
      },
    ],
    roadmap: [
      { day: 5, name: 'Message Search', description: 'Full-text search across channels', category: 'core', roles: [{ role: 'backend', effortDays: 6 }], cost: 4000, effect: { productScoreDelta: 5, churnMult: 0.95 } },
      { day: 10, name: 'Threaded Replies',        description: 'Thread replies to messages', category: 'core', roles: [{ role: 'frontend', effortDays: 4 }, { role: 'backend', effortDays: 3 }], cost: 3000, effect: { productScoreDelta: 3 } },
      { day: 15, name: 'Pro Tier', description: 'Paid plan with history + integrations', category: 'monetization', roles: [{ role: 'backend', effortDays: 5 }], cost: 4000, effect: { unlocksMonetizationTier: 'pro' } },
      { day: 20, name: 'Voice/Video Calls', description: '1:1 calls in DMs', category: 'core', roles: [{ role: 'frontend', effortDays: 8 }, { role: 'backend', effortDays: 6 }], cost: 8000, effect: { productScoreDelta: 7, churnMult: 0.9 } },
      { day: 30, name: 'App Directory', description: 'Third-party app integrations', category: 'growth', roles: [{ role: 'backend', effortDays: 8 }], cost: 6000, effect: { growthMult: 1.25 } },
    ],
  },
  {
    id: 'custom',
    label: 'Custom SaaS',
    icon: '⚙️',
    description: 'Start from scratch with just the MVP. You design the features.',
    starterFeatures: [
      {
        id: 'custom_starter_1',
        name: 'User Authentication',
        description: 'Sign up / log in / password reset',
        roles: ['backend', 'frontend'],
        effortDays: 4,
        cost: 2500,
        effect: { productScoreDelta: 5, churnMult: 0.97 },
      },
      {
        id: 'custom_starter_2',
        name: 'Basic Dashboard',
        description: 'Landing page + user dashboard',
        roles: ['frontend'],
        effortDays: 4,
        cost: 2500,
        effect: { productScoreDelta: 4, growthMult: 1.05 },
      },
    ],
    roadmap: [
      { day: 5, name: 'Settings Page', description: 'User profile + preferences', category: 'core', roles: [{ role: 'frontend', effortDays: 3 }, { role: 'backend', effortDays: 2 }], cost: 2000, effect: { productScoreDelta: 2 } },
      { day: 10, name: 'Pro Tier', description: 'Paid subscription plan', category: 'monetization', roles: [{ role: 'backend', effortDays: 5 }], cost: 4000, effect: { unlocksMonetizationTier: 'pro' } },
    ],
  },
];

export function getTemplate(id: SaasTemplate): SaasTemplateDef {
  return SAAS_TEMPLATES.find((t) => t.id === id) || SAAS_TEMPLATES[SAAS_TEMPLATES.length - 1];
}

// Generate a domain name suggestion from a product name
export function suggestDomain(productName: string): string {
  const cleaned = productName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tlds = ['.com', '.io', '.app', '.dev'];
  return `${cleaned}${tlds[Math.floor(Math.random() * tlds.length)]}`;
}
