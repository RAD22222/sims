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

// Extended lifecycle: concept → prototype → beta → qa → release_ready → live → scaling → sunset
export type ProductStatus =
  | 'pre_launch'    // concept + prototype building (MVP not yet shipped)
  | 'beta'          // MVP shipped, beta testers are testing
  | 'qa'            // beta done, collecting dev/customer feedback
  | 'release_ready' // all issues fixed, awaiting post-production setup
  | 'live'          // post-production done, product is live
  | 'scaling'       // lots of users
  | 'sunset';       // discontinued

export type SaasTemplate = 'project_mgmt' | 'crm' | 'analytics' | 'comms' | 'custom';

export interface Bug {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'fixed';
  foundDay: number;
  foundBy: 'beta_tester' | 'customer' | 'developer' | 'internal';
  fixRole: Role;
  fixEffortDays: number;
  progressDays: number;
  assignedEmployeeIds: string[];
  description?: string;
  reward?: number; // cash reward for fixing (beta tester bonus etc.)
}

export interface UserFeedback {
  id: string;
  day: number;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  category: 'bug' | 'feature_request' | 'praise' | 'complaint';
  status: 'new' | 'acknowledged' | 'addressed';
}

export interface BetaTester {
  id: string;
  name: string;
  skill: number;        // 0-100, higher = finds more bugs
  dailyCost: number;    // $/day
  daysRemaining: number; // days left in contract
  bugsFound: number;
  active: boolean;
}

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
  template?: SaasTemplate;     // SaaS template (project_mgmt, crm, etc.)
  status: ProductStatus;
  launchDate: number | null;
  users: number;
  mrr: number;
  churnRate: number;
  productScore: number;
  team: string[]; // employee ids dedicated
  kanban: FeatureCard[];
  bugs: Bug[];                  // active + fixed bugs
  feedback: UserFeedback[];     // user feedback (post-launch + QA)
  betaTesters: BetaTester[];    // hired beta testers
  betaStartDate: number | null;
  qaStartDate: number | null;
  releaseReadyDate: number | null;
  // Post-production setup
  domain: string | null;        // e.g. "myapp.com"
  domainCost: number;           // one-time domain registration cost
  databaseType: 'none' | 'shared' | 'dedicated' | 'cluster';
  databaseCost: number;         // monthly
  sslEnabled: boolean;
  cdnEnabled: boolean;
  // Hosting (existing)
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
  avgRating: number;            // avg user rating (1-5)
  totalRatings: number;
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
  activeTab: 'build' | 'product' | 'product_page' | 'staff' | 'office';
  activeProductId: string | null;
  onboardingComplete: boolean;
  selectedEmployeeId: string | null;
  totalRevenueAllTime: number;
  moraleBoostUntilDay: number;
  ipoTargetValuation: number;
}
