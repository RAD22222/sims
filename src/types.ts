// Core domain types for Startup Tycoon

export type Department =
  | 'engineering'
  | 'design'
  | 'product'
  | 'marketing'
  | 'sales'
  | 'support'
  | 'hr'
  | 'ops';

export type Role =
  | 'frontend'
  | 'backend'
  | 'mobile'
  | 'devops'
  | 'qa'
  | 'ui_ux'
  | 'product_designer'
  | 'product_manager'
  | 'growth_marketer'
  | 'content_marketer'
  | 'performance_marketer'
  | 'sales_rep'
  | 'account_exec'
  | 'support_rep'
  | 'hr_manager'
  | 'ops_manager';

export type Level = 'junior' | 'mid' | 'senior' | 'lead';

export type ProductType = 'saas' | 'mobile' | 'desktop' | 'os';

export type ProductStatus = 'pre_launch' | 'live' | 'scaling' | 'sunset';

export type CardCategory =
  | 'core'
  | 'monetization'
  | 'growth'
  | 'retention'
  | 'compliance'
  | 'infra'
  | 'polish';

export type CardStage = 'locked' | 'backlog' | 'in_progress' | 'qa' | 'shipped';

export interface Founder {
  name: string;
  specialization: Role;
  hasSteppedBack: boolean;
  deskId: string | null;
}

export interface Employee {
  id: string;
  name: string;
  department: Department;
  role: Role;
  level: Level;
  salary: number;
  skill: number; // 0-100
  morale: number; // 0-100
  assignedProductId: string | 'shared';
  deskId: string | null;
  hireDate: number;
  isLead: boolean;
  tenureDays: number;
  moraleHistory: number[];
}

export interface FeatureCardEffect {
  revenuePerUserMult?: number;
  churnMult?: number;
  productScoreDelta?: number;
  unlocksMonetizationTier?: 'pro' | 'enterprise';
  unlocksMarketSegment?: string;
  growthMult?: number;
  isMvp?: boolean;
  unlocksCompliance?: string;
  hostingReduction?: number;
  supportTicketReduction?: number;
  customEffect?: string;
}

export interface FeatureCard {
  id: string;
  name: string;
  category: CardCategory;
  requiredRoles: { role: Role; effortDays: number }[];
  cost: number;
  prereqCardIds: string[];
  effect: FeatureCardEffect;
  stage: CardStage;
  assignedEmployeeIds: string[];
  progressDays: number;
  totalEffortDays: number;
  bugRiskAtShip?: number;
  shippedDay?: number;
  isCustom?: boolean;       // user-created card (vs catalog)
  isBug?: boolean;          // auto-generated bug fix card
  priority?: number;        // 0 = normal, 1 = high, 2 = critical (for backlog ordering)
  description?: string;     // user-provided description for custom cards
  sourceCardId?: string;    // for bug cards: the card that spawned this bug
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  launchDate: number | null;
  users: number;
  mrr: number;
  churnRate: number;
  productScore: number;
  team: string[]; // employee ids dedicated
  kanban: FeatureCard[];
  hostingPlanId: string;
  monetizationTiers: { free: boolean; pro: boolean; enterprise: boolean };
  proPrice: number; // $/user/month
  enterprisePrice: number; // $/account/month
  marketing: { level: 0 | 1 | 2; spendDaily: number };
  marketingEventLog: { day: number; message: string; type: 'good' | 'bad' | 'info' }[];
  supportTickets: number;
  overload: boolean;
  churnedToday: number;
  gainedToday: number;
  revenueToday: number;
}

export interface HostingPlan {
  id: string;
  name: string;
  costMonthly: number;
  capacity: number;
  autoScales: boolean;
  description: string;
  productTypes: ProductType[];
}

export interface FundingRound {
  roundNumber: number;
  cashRaised: number;
  equityGiven: number;
  growthTarget: { metric: 'users' | 'mrr'; threshold: number; deadlineDay: number } | null;
  investorConfidence: number; // 0-100
  acceptedDay: number;
}

export interface Competitor {
  id: string;
  name: string;
  users: number;
  growthRate: number;
}

export interface GameEvent {
  id: string;
  day: number;
  title: string;
  description: string;
  type: 'good' | 'bad' | 'info';
  modifiers?: EventModifier[];
  durationDays: number;
}

export interface EventModifier {
  kind: 'growth' | 'churn' | 'morale' | 'cost' | 'support' | 'revenue';
  target: 'company' | string; // product id or 'company'
  mult: number;
}

export interface Notification {
  id: string;
  day: number;
  title: string;
  body: string;
  type: 'good' | 'bad' | 'info' | 'milestone';
  read: boolean;
}

export interface GameState {
  day: number;
  cash: number;
  isPaused: boolean;
  gameSpeed: 1 | 2 | 3;
  gameOverReason: null | 'bankruptcy' | 'takeover' | 'ipo';
  ipoSustainedDays: number;
  founder: Founder;
  staff: Employee[];
  candidatePool: Employee[];
  candidatePoolRefreshDay: number;
  products: Product[];
  hostingPlans: HostingPlan[];
  funding: FundingRound[];
  competitors: Competitor[];
  activeEvents: GameEvent[];
  history: { day: number; totalUsers: number; cash: number; mrr: number }[];
  notifications: Notification[];
  officeTier: 'garage' | 'loft' | 'floor' | 'tower';
  founderActionCooldowns: Record<string, number>;
  pendingFundingOffer: FundingRound | null;
  activeTab: 'build' | 'product' | 'staff' | 'office';
  activeProductId: string | null;
  onboardingComplete: boolean;
  selectedEmployeeId: string | null;
  totalRevenueAllTime: number;
  moraleBoostUntilDay: number;
  ipoTargetValuation: number;
}
