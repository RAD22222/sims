import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Employee, Product, ProductType, FeatureCard, Role, Level, SaasTemplate, Bug, BetaTester, UserFeedback } from '../types';
import { resolveDay } from '../sim/resolveDay';
import { generateCandidatePool, promoteEmployee, reassignEmployee, DEPARTMENT_OF_ROLE } from '../sim/staff';
import { autoAssignEmployees, forceShip } from '../sim/kanban';
import { buildInitialKanban } from '../data/catalogs';
import { HOSTING_PLANS } from '../data/catalogs/hosting';
import { getTemplate, suggestDomain } from '../data/catalogs/saasTemplates';
import { acceptFunding } from '../sim/funding';
import { uid, randomName, randomCompanyName } from '../data/names';

const NEW_PRODUCT_FEE = 10_000; // reduced from 25K to make early game smoother

export interface GameActions {
  tick: () => void;
  setPaused: (p: boolean) => void;
  setSpeed: (s: 1 | 2 | 3) => void;
  setActiveTab: (t: GameState['activeTab']) => void;
  setActiveProduct: (id: string | null) => void;
  selectEmployee: (id: string | null) => void;

  // Founder
  createFounder: (name: string, specialization: Role) => void;
  stepBackFounder: () => void;
  triggerFounderAction: (action: 'pep_talk' | 'crunch_call' | 'close_deal' | 'investor_call') => void;

  // Staff
  refreshCandidatePool: () => void;
  hireCandidate: (candidateId: string, productId: string | 'shared') => void;
  fireEmployee: (empId: string) => void;
  promoteEmployeeAction: (empId: string) => void;
  reassignEmployeeAction: (empId: string, productId: string | 'shared') => void;
  runCultureInitiative: () => void;

  // Kanban
  startCard: (productId: string, cardId: string) => void;
  cancelCard: (productId: string, cardId: string) => void;
  forceShipCard: (productId: string, cardId: string) => void;
  assignEmployeeToCard: (productId: string, cardId: string, empId: string) => void;
  unassignEmployeeFromCard: (productId: string, cardId: string, empId: string) => void;
  // New build-section functions
  createCustomCard: (productId: string, card: Omit<FeatureCard, 'id' | 'stage' | 'assignedEmployeeIds' | 'progressDays'>) => boolean;
  deleteCustomCard: (productId: string, cardId: string) => void;
  setCardPriority: (productId: string, cardId: string, priority: 0 | 1 | 2) => void;
  reorderBacklogCard: (productId: string, cardId: string, direction: 'up' | 'down') => void;
  toggleCardLock: (productId: string, cardId: string) => void;

  // Products
  createProduct: (name: string, type: ProductType, template?: SaasTemplate, starterFeatureIds?: string[]) => boolean;
  sunsetProduct: (productId: string) => void;
  setHostingPlan: (productId: string, planId: string) => void;
  setMarketingLevel: (productId: string, level: 0 | 1 | 2) => void;
  setMarketingSpend: (productId: string, spendDaily: number) => void;
  setProPrice: (productId: string, price: number) => void;
  setEnterprisePrice: (productId: string, price: number) => void;

  // Beta / QA / Release lifecycle
  startBetaTesting: (productId: string, testerCount: number, daysPerTester: number) => void;
  hireBetaTester: (productId: string, tester: BetaTester) => void;
  fixBug: (productId: string, bugId: string) => void;
  startQA: (productId: string) => void;
  markReleaseReady: (productId: string) => void;
  releaseProduct: (productId: string) => void;
  acknowledgeFeedback: (productId: string, feedbackId: string) => void;
  // Post-production
  setDomain: (productId: string, domain: string) => void;
  setDatabase: (productId: string, dbType: 'none' | 'shared' | 'dedicated' | 'cluster') => void;
  toggleSSL: (productId: string) => void;
  toggleCDN: (productId: string) => void;

  // Funding
  acceptPendingFunding: () => void;
  rejectPendingFunding: () => void;

  // Onboarding
  completeOnboarding: () => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  // Save/load
  resetGame: () => void;
  hardReset: () => void;
}

export type Store = GameState & GameActions;

const initialFounder = {
  name: '',
  specialization: 'frontend' as Role,
  hasSteppedBack: false,
  deskId: null,
};

function makeInitialProduct(name: string, type: ProductType, template?: SaasTemplate, starterFeatureIds?: string[]): Product {
  const hostingPlanId = type === 'saas' ? 'shared' : type === 'mobile' ? 'mobile_cdn' : type === 'desktop' ? 'license' : 'baremetal';
  // Build kanban: start with template-based starter features (if SaaS) + catalog
  let kanban: FeatureCard[] = [];
  if (type === 'saas' && template) {
    const tmpl = getTemplate(template);
    // MVP is always first
    const mvpCard: FeatureCard = {
      id: `${name}_mvp`,
      name: 'MVP / Prototype',
      category: 'core',
      requiredRoles: [
        { role: 'frontend', effortDays: 8 },
        { role: 'backend', effortDays: 8 },
        { role: 'ui_ux', effortDays: 4 },
      ],
      cost: 4000,
      prereqCardIds: [],
      effect: { productScoreDelta: 15, isMvp: true },
      stage: 'backlog',
      assignedEmployeeIds: [],
      progressDays: 0,
      totalEffortDays: 20,
    };
    kanban.push(mvpCard);
    // Add selected starter features
    for (const sf of tmpl.starterFeatures) {
      if (!starterFeatureIds || starterFeatureIds.includes(sf.id)) {
        kanban.push({
          id: `${name}_${sf.id}`,
          name: sf.name,
          category: 'core',
          requiredRoles: sf.roles.map((r) => ({ role: r, effortDays: Math.ceil(sf.effortDays / sf.roles.length) })),
          cost: sf.cost,
          prereqCardIds: [],
          effect: sf.effect,
          stage: 'backlog',
          assignedEmployeeIds: [],
          progressDays: 0,
          totalEffortDays: sf.effortDays,
          description: sf.description,
        });
      }
    }
    // Add roadmap features as locked cards (unlock by day)
    for (const rm of tmpl.roadmap) {
      kanban.push({
        id: `${name}_rm_${rm.day}_${rm.name.replace(/\s/g, '_').toLowerCase()}`,
        name: rm.name,
        category: rm.category,
        requiredRoles: rm.roles,
        cost: rm.cost,
        prereqCardIds: [],
        effect: rm.effect,
        stage: 'locked',
        assignedEmployeeIds: [],
        progressDays: 0,
        totalEffortDays: rm.roles.reduce((s, r) => s + r.effortDays, 0),
        description: `Unlocks Day ${rm.day}. ${rm.description}`,
      });
    }
  } else {
    kanban = buildInitialKanban(type);
  }

  return {
    id: uid('prod'),
    name,
    type,
    template,
    status: 'pre_launch',
    launchDate: null,
    users: 0,
    mrr: 0,
    churnRate: 0.05,
    productScore: 0,
    team: [],
    kanban,
    bugs: [],
    feedback: [],
    betaTesters: [],
    betaStartDate: null,
    qaStartDate: null,
    releaseReadyDate: null,
    domain: null,
    domainCost: 0,
    databaseType: 'none',
    databaseCost: 0,
    sslEnabled: false,
    cdnEnabled: false,
    hostingPlanId,
    monetizationTiers: { free: true, pro: false, enterprise: false },
    proPrice: 20,
    enterprisePrice: 500,
    marketing: { level: 0, spendDaily: 0 },
    marketingEventLog: [],
    supportTickets: 0,
    overload: false,
    churnedToday: 0,
    gainedToday: 0,
    revenueToday: 0,
    avgRating: 0,
    totalRatings: 0,
  };
}

const initialState: GameState = {
  day: 0,
  cash: 100_000,
  isPaused: true,
  gameSpeed: 1,
  gameOverReason: null,
  ipoSustainedDays: 0,
  founder: { ...initialFounder },
  staff: [],
  candidatePool: [],
  candidatePoolRefreshDay: 0,
  products: [],
  hostingPlans: HOSTING_PLANS,
  funding: [],
  competitors: [],
  activeEvents: [],
  history: [],
  notifications: [],
  officeTier: 'garage',
  founderActionCooldowns: {},
  pendingFundingOffer: null,
  activeTab: 'build',
  activeProductId: null,
  onboardingComplete: false,
  selectedEmployeeId: null,
  totalRevenueAllTime: 0,
  moraleBoostUntilDay: 0,
  ipoTargetValuation: 50_000_000,
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      tick: () => {
        const state = get();
        if (state.gameOverReason !== null || state.isPaused) return;
        const newState = resolveDay(state);
        set({ ...newState });
      },

      setPaused: (p) => set({ isPaused: p }),
      setSpeed: (s) => set({ gameSpeed: s, isPaused: false }),
      setActiveTab: (t) => set({ activeTab: t }),
      setActiveProduct: (id) => set({ activeProductId: id }),
      selectEmployee: (id) => set({ selectedEmployeeId: id }),

      createFounder: (name, specialization) => {
        set({
          founder: { name, specialization, hasSteppedBack: false, deskId: 'founder_desk' },
          products: [],
          activeProductId: null,
          isPaused: true,
          notifications: [...get().notifications, {
            id: uid('notif'), day: 0, title: 'Welcome!', body: `Welcome, ${name}! Click "New Product" in the Build tab to create your first SaaS product.`, type: 'milestone', read: false,
          }],
        });
      },

      stepBackFounder: () => {
        const state = get();
        if (state.founder.hasSteppedBack) return;
        // Requires a Mid-or-better employee in the founder's role
        const hasReplacement = state.staff.some(
          (e) => e.role === state.founder.specialization && (e.level === 'mid' || e.level === 'senior' || e.level === 'lead')
        );
        if (!hasReplacement) return;
        set({
          founder: { ...state.founder, hasSteppedBack: true, deskId: null },
          notifications: [
            ...state.notifications,
            {
              id: uid('notif'),
              day: state.day,
              title: 'Founder Stepped Back',
              body: `${state.founder.name} has handed off the desk. Founder Actions unlocked. Company-wide ${state.founder.specialization} bonus active.`,
              type: 'milestone',
              read: false,
            },
          ],
        });
      },

      triggerFounderAction: (action) => {
        const state = get();
        if (!state.founder.hasSteppedBack) return;
        const cooldownKey = action;
        const lastUsed = state.founderActionCooldowns[cooldownKey] ?? -999;
        if (state.day - lastUsed < 14) return; // 14-day cooldown
        switch (action) {
          case 'pep_talk':
            set({
              staff: state.staff.map((e) => ({ ...e, morale: Math.min(100, e.morale + 10) })),
              moraleBoostUntilDay: state.day + 7,
              founderActionCooldowns: { ...state.founderActionCooldowns, [cooldownKey]: state.day },
              notifications: [...state.notifications, {
                id: uid('notif'), day: state.day, title: 'Pep Talk!', body: 'Founder pep talk lifted morale +10 across the team, with a 7-day morale boost.', type: 'good', read: false,
              }],
            });
            break;
          case 'crunch_call':
            // +50% output for 5 days (modeled as morale boost + small drift)
            set({
              moraleBoostUntilDay: state.day + 5,
              founderActionCooldowns: { ...state.founderActionCooldowns, [cooldownKey]: state.day },
              notifications: [...state.notifications, {
                id: uid('notif'), day: state.day, title: 'Crunch Call', body: 'Founder pushed the team for a crunch — output boosted for 5 days, but morale may dip afterward.', type: 'info', read: false,
              }],
            });
            break;
          case 'close_deal':
            // Closes enterprise deals: +$50K one-time revenue from products with enterprise tier unlocked
            {
              const entProducts = state.products.filter((p) => p.monetizationTiers.enterprise);
              if (entProducts.length > 0) {
                const cashGain = 50_000 * entProducts.length;
                set({
                  cash: state.cash + cashGain,
                  founderActionCooldowns: { ...state.founderActionCooldowns, [cooldownKey]: state.day },
                  notifications: [...state.notifications, {
                    id: uid('notif'), day: state.day, title: 'Deal Closed!', body: `Founder personally closed enterprise deals — +$${cashGain.toLocaleString()} cash.`, type: 'good', read: false,
                  }],
                });
              }
            }
            break;
          case 'investor_call':
            // +15 investor confidence to latest funding round
            if (state.funding.length > 0) {
              const funding = [...state.funding];
              const latest = funding[funding.length - 1];
              funding[funding.length - 1] = { ...latest, investorConfidence: Math.min(100, latest.investorConfidence + 15) };
              set({
                funding,
                founderActionCooldowns: { ...state.founderActionCooldowns, [cooldownKey]: state.day },
                notifications: [...state.notifications, {
                  id: uid('notif'), day: state.day, title: 'Investor Call', body: 'Founder reassured investors — confidence +15.', type: 'good', read: false,
                }],
              });
            }
            break;
        }
      },

      refreshCandidatePool: () => {
        const state = get();
        const hasHr = state.staff.some((e) => e.role === 'hr_manager');
        const discount = state.founder.specialization === 'ops_manager' ? 0.9 : 1.0;
        // Compute needed roles: any role that's required by an in-progress card but has zero team members
        const neededRoles: Role[] = [];
        for (const p of state.products) {
          if (p.status === 'sunset') continue;
          for (const card of p.kanban) {
            if (card.stage !== 'in_progress') continue;
            for (const req of card.requiredRoles) {
              const hasCapacity =
                state.staff.some((e) => e.assignedProductId === p.id && e.role === req.role) ||
                (!state.founder.hasSteppedBack && state.founder.specialization === req.role);
              if (!hasCapacity && !neededRoles.includes(req.role)) {
                neededRoles.push(req.role);
              }
            }
          }
        }
        const pool = generateCandidatePool(state.day, hasHr, discount, neededRoles);
        set({ candidatePool: pool, candidatePoolRefreshDay: state.day + 7 });
      },

      hireCandidate: (candidateId, productId) => {
        const state = get();
        const candidate = state.candidatePool.find((c) => c.id === candidateId);
        if (!candidate) return;
        const newEmp: Employee = {
          ...candidate,
          assignedProductId: productId,
          hireDate: state.day,
          tenureDays: 0,
          moraleHistory: [candidate.morale],
        };
        const updatedProducts = state.products.map((p) =>
          p.id === productId ? { ...p, team: [...p.team, newEmp.id] } : p
        );
        set({
          staff: [...state.staff, newEmp],
          candidatePool: state.candidatePool.filter((c) => c.id !== candidateId),
          products: updatedProducts,
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'New Hire', body: `${newEmp.name} joined as ${newEmp.role} (${newEmp.level}).`, type: 'info', read: false,
          }],
        });
      },

      fireEmployee: (empId) => {
        const state = get();
        const emp = state.staff.find((e) => e.id === empId);
        if (!emp) return;
        set({
          staff: state.staff.filter((e) => e.id !== empId),
          products: state.products.map((p) => ({
            ...p,
            team: p.team.filter((id) => id !== empId),
            kanban: p.kanban.map((c) => ({ ...c, assignedEmployeeIds: c.assignedEmployeeIds.filter((id) => id !== empId) })),
          })),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'Employee Let Go', body: `${emp.name} has been let go.`, type: 'info', read: false,
          }],
        });
      },

      promoteEmployeeAction: (empId) => {
        const state = get();
        const emp = state.staff.find((e) => e.id === empId);
        if (!emp) return;
        const promoted = promoteEmployee(emp);
        if (promoted.level === emp.level) return; // max level
        set({
          staff: state.staff.map((e) => (e.id === empId ? promoted : e)),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'Promotion', body: `${emp.name} promoted to ${promoted.level}.`, type: 'good', read: false,
          }],
        });
      },

      reassignEmployeeAction: (empId, productId) => {
        const state = get();
        const emp = state.staff.find((e) => e.id === empId);
        if (!emp) return;
        const reassigned = reassignEmployee(emp, productId);
        const oldProductId = emp.assignedProductId;
        const updatedProducts = state.products.map((p) => {
          if (p.id === oldProductId) {
            return { ...p, team: p.team.filter((id) => id !== empId) };
          }
          if (p.id === productId) {
            return { ...p, team: [...p.team, empId] };
          }
          return p;
        });
        set({
          staff: state.staff.map((e) => (e.id === empId ? reassigned : e)),
          products: updatedProducts,
        });
      },

      runCultureInitiative: () => {
        const state = get();
        if (state.cash < 10_000) return;
        set({
          cash: state.cash - 10_000,
          staff: state.staff.map((e) => ({ ...e, morale: Math.min(100, e.morale + 8) })),
          moraleBoostUntilDay: state.day + 14,
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'Culture Initiative', body: 'Culture initiative launched — morale +8 across the company, 14-day boost active.', type: 'good', read: false,
          }],
        });
      },

      startCard: (productId, cardId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const card = product.kanban.find((c) => c.id === cardId);
        if (!card) return;
        if (card.stage !== 'backlog') return;
        // Auto-assign idle employees with matching role on this product
        const teamEmployees = state.staff.filter((e) => e.assignedProductId === productId);
        const assignedIds = autoAssignEmployees(card, teamEmployees);
        // Check cash for cost
        if (state.cash < card.cost) {
          set({
            notifications: [...state.notifications, {
              id: uid('notif'), day: state.day, title: 'Insufficient Cash', body: `Cannot start ${card.name} — need $${card.cost.toLocaleString()} cash.`, type: 'bad', read: false,
            }],
          });
          return;
        }
        const updatedKanban = product.kanban.map((c) =>
          c.id === cardId ? { ...c, stage: 'in_progress' as const, assignedEmployeeIds: assignedIds, progressDays: 0 } : c
        );
        set({
          cash: state.cash - card.cost,
          products: state.products.map((p) => (p.id === productId ? { ...p, kanban: updatedKanban } : p)),
        });
      },

      cancelCard: (productId, cardId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const card = product.kanban.find((c) => c.id === cardId);
        if (!card) return;
        if (card.stage !== 'in_progress') return;
        const updatedKanban = product.kanban.map((c) =>
          c.id === cardId ? { ...c, stage: 'backlog' as const, assignedEmployeeIds: [], progressDays: 0 } : c
        );
        set({
          products: state.products.map((p) => (p.id === productId ? { ...p, kanban: updatedKanban } : p)),
        });
      },

      forceShipCard: (productId, cardId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const card = product.kanban.find((c) => c.id === cardId);
        if (!card || card.stage !== 'qa') return;
        const updatedKanban = [...product.kanban];
        const idx = updatedKanban.findIndex((c) => c.id === cardId);
        const updated = { ...updatedKanban[idx] };
        forceShip(updated, state.day);
        updatedKanban[idx] = updated;
        // If MVP, mark product as launched
        let updatedProduct: Product = { ...product, kanban: updatedKanban };
        if (card.effect.isMvp) {
          updatedProduct = { ...updatedProduct, status: 'live', launchDate: state.day };
        }
        set({
          products: state.products.map((p) => (p.id === productId ? updatedProduct : p)),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'Card Force-Shipped', body: `${card.name} was force-shipped from QA. Raised bug risk.`, type: 'info', read: false,
          }],
        });
      },

      assignEmployeeToCard: (productId, cardId, empId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const updatedKanban = product.kanban.map((c) => {
          if (c.id !== cardId || c.stage !== 'in_progress') return c;
          if (c.assignedEmployeeIds.includes(empId)) return c;
          return { ...c, assignedEmployeeIds: [...c.assignedEmployeeIds, empId] };
        });
        set({
          products: state.products.map((p) => (p.id === productId ? { ...p, kanban: updatedKanban } : p)),
        });
      },

      unassignEmployeeFromCard: (productId, cardId, empId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const updatedKanban = product.kanban.map((c) =>
          c.id === cardId
            ? { ...c, assignedEmployeeIds: c.assignedEmployeeIds.filter((id) => id !== empId) }
            : c
        );
        set({
          products: state.products.map((p) => (p.id === productId ? { ...p, kanban: updatedKanban } : p)),
        });
      },

      createCustomCard: (productId, cardSpec) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return false;
        if (state.cash < cardSpec.cost) {
          set({
            notifications: [...state.notifications, {
              id: uid('notif'), day: state.day, title: 'Insufficient Cash', body: `Cannot add ${cardSpec.name} — need $${cardSpec.cost.toLocaleString()} to start.`, type: 'bad', read: false,
            }],
          });
          return false;
        }
        const newCard: FeatureCard = {
          ...cardSpec,
          id: uid('card'),
          stage: 'backlog',
          assignedEmployeeIds: [],
          progressDays: 0,
        };
        set({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, kanban: [...p.kanban, newCard] } : p
          ),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'Custom Feature Added', body: `"${cardSpec.name}" added to backlog. Cost: $${cardSpec.cost.toLocaleString()}.`, type: 'info', read: false,
          }],
        });
        return true;
      },

      deleteCustomCard: (productId, cardId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const card = product.kanban.find((c) => c.id === cardId);
        if (!card || !card.isCustom) return; // only custom cards can be deleted
        if (card.stage === 'in_progress' || card.stage === 'qa') return; // can't delete in-flight
        set({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, kanban: p.kanban.filter((c) => c.id !== cardId) } : p
          ),
        });
      },

      setCardPriority: (productId, cardId, priority) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        set({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, kanban: p.kanban.map((c) => (c.id === cardId ? { ...c, priority } : c)) }
              : p
          ),
        });
      },

      reorderBacklogCard: (productId, cardId, direction) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const idx = product.kanban.findIndex((c) => c.id === cardId);
        if (idx === -1) return;
        // Find the next backlog card in the requested direction
        const backlogIndices = product.kanban
          .map((c, i) => (c.stage === 'backlog' || c.stage === 'locked' ? i : -1))
          .filter((i) => i !== -1);
        const posInBacklog = backlogIndices.indexOf(idx);
        if (posInBacklog === -1) return;
        const swapWithPos = direction === 'up' ? posInBacklog - 1 : posInBacklog + 1;
        if (swapWithPos < 0 || swapWithPos >= backlogIndices.length) return;
        const swapIdx = backlogIndices[swapWithPos];
        const newKanban = [...product.kanban];
        const tmp = newKanban[idx];
        newKanban[idx] = newKanban[swapIdx];
        newKanban[swapIdx] = tmp;
        set({
          products: state.products.map((p) => (p.id === productId ? { ...p, kanban: newKanban } : p)),
        });
      },

      toggleCardLock: (productId, cardId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const card = product.kanban.find((c) => c.id === cardId);
        if (!card) return;
        // Only allow toggling if card is in backlog or locked
        if (card.stage !== 'backlog' && card.stage !== 'locked') return;
        const newStage = card.stage === 'locked' ? 'backlog' : 'locked';
        set({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, kanban: p.kanban.map((c) => (c.id === cardId ? { ...c, stage: newStage } : c)) }
              : p
          ),
        });
      },

      createProduct: (name, type, template, starterFeatureIds) => {
        const state = get();
        if (state.cash < NEW_PRODUCT_FEE) return false;
        // OS requires 2+ successful products
        if (type === 'os') {
          const successful = state.products.filter((p) => p.launchDate !== null && p.users > 1000);
          if (successful.length < 2) return false;
        }
        const product = makeInitialProduct(name, type, template, starterFeatureIds);
        set({
          cash: state.cash - NEW_PRODUCT_FEE,
          products: [...state.products, product],
          activeProductId: product.id,
          activeTab: 'build',
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'New Product Initiative', body: `${name} (${type}) created. Hire staff and start the MVP!`, type: 'milestone', read: false,
          }],
        });
        return true;
      },

      sunsetProduct: (productId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        // Free up staff to shared, stop costs
        set({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, status: 'sunset', marketing: { ...p.marketing, spendDaily: 0, level: 0 } } : p
          ),
          staff: state.staff.map((e) =>
            e.assignedProductId === productId ? { ...e, assignedProductId: 'shared' as const } : e
          ),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'Product Sunset', body: `${product.name} has been sunset. Staff released to shared services. One-time reputation hit.`, type: 'bad', read: false,
          }],
        });
      },

      setHostingPlan: (productId, planId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const plan = HOSTING_PLANS.find((p) => p.id === planId);
        if (!plan) return;
        if (!plan.productTypes.includes(product.type)) return;
        set({
          products: state.products.map((p) => (p.id === productId ? { ...p, hostingPlanId: planId } : p)),
        });
      },

      setMarketingLevel: (productId, level) => {
        const state = get();
        set({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, marketing: { ...p.marketing, level } } : p
          ),
        });
      },

      setMarketingSpend: (productId, spendDaily) => {
        set({
          products: get().products.map((p) =>
            p.id === productId ? { ...p, marketing: { ...p.marketing, spendDaily } } : p
          ),
        });
      },

      setProPrice: (productId, price) => {
        set({
          products: get().products.map((p) =>
            p.id === productId ? { ...p, proPrice: price } : p
          ),
        });
      },

      setEnterprisePrice: (productId, price) => {
        set({
          products: get().products.map((p) =>
            p.id === productId ? { ...p, enterprisePrice: price } : p
          ),
        });
      },

      // ===== Beta / QA / Release lifecycle =====

      startBetaTesting: (productId, testerCount, daysPerTester) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        if (product.status !== 'pre_launch') return;
        // MVP must be shipped to start beta
        const mvpShipped = product.kanban.some((c) => c.effect.isMvp && c.stage === 'shipped');
        if (!mvpShipped) return;
        // Generate beta testers
        const testers: BetaTester[] = [];
        for (let i = 0; i < testerCount; i++) {
          testers.push({
            id: uid('tester'),
            name: randomName(),
            skill: 40 + Math.random() * 40,
            dailyCost: 200 + Math.random() * 300,
            daysRemaining: daysPerTester,
            bugsFound: 0,
            active: true,
          });
        }
        const totalCost = testers.reduce((s, t) => s + t.dailyCost * daysPerTester, 0);
        if (state.cash < totalCost) {
          set({
            notifications: [...state.notifications, {
              id: uid('notif'), day: state.day, title: 'Cannot Afford Beta', body: `Need $${totalCost.toLocaleString()} for ${testerCount} testers × ${daysPerTester} days.`, type: 'bad', read: false,
            }],
          });
          return;
        }
        set({
          cash: state.cash - totalCost,
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, status: 'beta', betaTesters: testers, betaStartDate: state.day }
              : p
          ),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: '🧪 Beta Testing Started', body: `${testerCount} beta testers hired for ${daysPerTester} days. They'll find bugs!`, type: 'milestone', read: false,
          }],
        });
      },

      hireBetaTester: (productId, tester) => {
        const state = get();
        set({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, betaTesters: [...p.betaTesters, tester] }
              : p
          ),
        });
      },

      fixBug: (productId, bugId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const bug = product.bugs.find((b) => b.id === bugId);
        if (!bug || bug.status !== 'open') return;
        // Mark as in_progress, auto-assign matching employee
        const teamEmployees = state.staff.filter((e) => e.assignedProductId === productId);
        const matching = teamEmployees.filter((e) => e.role === bug.fixRole);
        const assignedIds = matching.slice(0, 1).map((e) => e.id);
        set({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, bugs: p.bugs.map((b) => b.id === bugId ? { ...b, status: 'in_progress', assignedEmployeeIds: assignedIds } : b) }
              : p
          ),
        });
      },

      startQA: (productId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        if (product.status !== 'beta') return;
        // All open bugs must be fixed before QA
        const openBugs = product.bugs.filter((b) => b.status === 'open');
        if (openBugs.length > 0) {
          set({
            notifications: [...state.notifications, {
              id: uid('notif'), day: state.day, title: 'Cannot Start QA', body: `Fix all ${openBugs.length} open bugs first.`, type: 'bad', read: false,
            }],
          });
          return;
        }
        set({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, status: 'qa', qaStartDate: state.day } : p
          ),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: '🔬 QA Phase Started', body: `${product.name} is now in QA. Developers and customers will provide feedback.`, type: 'milestone', read: false,
          }],
        });
      },

      markReleaseReady: (productId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        if (product.status !== 'qa') return;
        set({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, status: 'release_ready', releaseReadyDate: state.day } : p
          ),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: '✅ Release Ready', body: `${product.name} is ready to release! Set up domain, database, and hosting in the Product tab to go live.`, type: 'milestone', read: false,
          }],
        });
      },

      releaseProduct: (productId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        if (product.status !== 'release_ready') return;
        // Require post-production setup
        if (!product.domain || !product.sslEnabled) {
          set({
            notifications: [...state.notifications, {
              id: uid('notif'), day: state.day, title: 'Cannot Release', body: `Need a domain and SSL enabled before going live.`, type: 'bad', read: false,
            }],
          });
          return;
        }
        set({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, status: 'live', launchDate: state.day } : p
          ),
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: '🚀 Product is LIVE!', body: `${product.name} is now live at ${product.domain}! Users can sign up.`, type: 'milestone', read: false,
          }],
        });
      },

      acknowledgeFeedback: (productId, feedbackId) => {
        const state = get();
        set({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, feedback: p.feedback.map((f) => f.id === feedbackId ? { ...f, status: 'acknowledged' } : f) }
              : p
          ),
        });
      },

      // ===== Post-production setup =====

      setDomain: (productId, domain) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const cost = 500; // domain registration cost
        if (product.domain === null && state.cash < cost) {
          set({
            notifications: [...state.notifications, {
              id: uid('notif'), day: state.day, title: 'Cannot Afford Domain', body: `Domain registration costs $${cost}.`, type: 'bad', read: false,
            }],
          });
          return;
        }
        set({
          cash: product.domain === null ? state.cash - cost : state.cash,
          products: state.products.map((p) =>
            p.id === productId ? { ...p, domain, domainCost: cost } : p
          ),
        });
      },

      setDatabase: (productId, dbType) => {
        const state = get();
        const costs = { none: 0, shared: 100, dedicated: 500, cluster: 2000 };
        const cost = costs[dbType];
        set({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, databaseType: dbType, databaseCost: cost } : p
          ),
        });
      },

      toggleSSL: (productId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const cost = !product.sslEnabled ? 200 : 0; // one-time SSL setup
        if (cost > 0 && state.cash < cost) return;
        set({
          cash: state.cash - cost,
          products: state.products.map((p) =>
            p.id === productId ? { ...p, sslEnabled: !p.sslEnabled } : p
          ),
        });
      },

      toggleCDN: (productId) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;
        const cost = !product.cdnEnabled ? 300 : 0;
        if (cost > 0 && state.cash < cost) return;
        set({
          cash: state.cash - cost,
          products: state.products.map((p) =>
            p.id === productId ? { ...p, cdnEnabled: !p.cdnEnabled } : p
          ),
        });
      },

      acceptPendingFunding: () => {
        const state = get();
        if (!state.pendingFundingOffer) return;
        const newState = acceptFunding(state, state.pendingFundingOffer);
        set(newState);
      },

      rejectPendingFunding: () => {
        const state = get();
        set({
          pendingFundingOffer: null,
          notifications: [...state.notifications, {
            id: uid('notif'), day: state.day, title: 'Funding Offer Rejected', body: 'You walked away from the term sheet.', type: 'info', read: false,
          }],
        });
      },

      completeOnboarding: () => set({ onboardingComplete: true }),

      markNotificationRead: (id) => {
        set({
          notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        });
      },
      markAllNotificationsRead: () => {
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) });
      },
      dismissNotification: (id) => {
        set({ notifications: get().notifications.filter((n) => n.id !== id) });
      },

      resetGame: () => {
        set({
          ...initialState,
          day: 0,
          cash: 100_000,
          isPaused: true,
          gameSpeed: 1,
          gameOverReason: null,
          ipoSustainedDays: 0,
          founder: { ...initialFounder },
          staff: [],
          candidatePool: [],
          products: [],
          funding: [],
          activeEvents: [],
          history: [],
          notifications: [],
          pendingFundingOffer: null,
          activeProductId: null,
          officeTier: 'garage',
          founderActionCooldowns: {},
          selectedEmployeeId: null,
          totalRevenueAllTime: 0,
          moraleBoostUntilDay: 0,
        });
      },

      hardReset: () => {
        set({ ...initialState });
        localStorage.removeItem('startup-tycoon-save');
      },
    }),
    {
      name: 'startup-tycoon-save',
      version: 1,
    }
  )
);
