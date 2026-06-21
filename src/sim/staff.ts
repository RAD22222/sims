import type { Department, Employee, Level, Role } from '../types';
import { randomName, uid } from '../data/names';

export const DEPARTMENT_OF_ROLE: Record<Role, Department> = {
  frontend: 'engineering',
  backend: 'engineering',
  mobile: 'engineering',
  devops: 'engineering',
  qa: 'engineering',
  ui_ux: 'design',
  product_designer: 'design',
  product_manager: 'product',
  growth_marketer: 'marketing',
  content_marketer: 'marketing',
  performance_marketer: 'marketing',
  sales_rep: 'sales',
  account_exec: 'sales',
  support_rep: 'support',
  hr_manager: 'hr',
  ops_manager: 'ops',
};

export const LEVEL_MULT: Record<Level, number> = {
  junior: 0.6,
  mid: 1.0,
  senior: 1.5,
  lead: 2.0,
};

export const LEVEL_SALARY_BASE: Record<Level, number> = {
  junior: 4000,
  mid: 7000,
  senior: 12000,
  lead: 18000,
};

export const ROLE_SALARY_MULT: Record<Role, number> = {
  frontend: 1.0,
  backend: 1.05,
  mobile: 1.0,
  devops: 1.1,
  qa: 0.85,
  ui_ux: 0.95,
  product_designer: 0.95,
  product_manager: 1.1,
  growth_marketer: 0.9,
  content_marketer: 0.8,
  performance_marketer: 0.95,
  sales_rep: 0.85,
  account_exec: 1.0,
  support_rep: 0.7,
  hr_manager: 0.9,
  ops_manager: 1.0,
};

export function dailySalary(emp: Employee): number {
  return (emp.salary / 30);
}

export function employeeOutputPerDay(emp: Employee): number {
  // Output = LEVEL_MULT * (0.5 + skill/100) * (0.5 + morale/100)
  return LEVEL_MULT[emp.level] * (0.5 + emp.skill / 100) * (0.5 + emp.morale / 100);
}

const ROLE_POOL: Role[] = [
  'frontend', 'backend', 'mobile', 'devops', 'qa',
  'ui_ux', 'product_designer', 'product_manager',
  'growth_marketer', 'content_marketer', 'performance_marketer',
  'sales_rep', 'account_exec',
  'support_rep',
  'hr_manager', 'ops_manager',
];

export function generateCandidate(day: number, forceRole?: Role, salaryDiscount = 1.0): Employee {
  const role = forceRole || ROLE_POOL[Math.floor(Math.random() * ROLE_POOL.length)];
  const department = DEPARTMENT_OF_ROLE[role];
  // Level distribution: junior 50%, mid 35%, senior 13%, lead 2%
  const r = Math.random();
  let level: Level = 'junior';
  if (r > 0.98) level = 'lead';
  else if (r > 0.85) level = 'senior';
  else if (r > 0.5) level = 'mid';
  const baseSalary = LEVEL_SALARY_BASE[level] * ROLE_SALARY_MULT[role] * salaryDiscount;
  const salary = Math.round(baseSalary * (0.9 + Math.random() * 0.3));
  const skill = Math.min(100, Math.max(20, Math.round(
    (level === 'lead' ? 75 : level === 'senior' ? 65 : level === 'mid' ? 50 : 35) + (Math.random() * 25 - 5)
  )));
  return {
    id: uid('emp'),
    name: randomName(),
    department,
    role,
    level,
    salary,
    skill,
    morale: 70 + Math.random() * 15,
    assignedProductId: 'shared',
    deskId: null,
    hireDate: day,
    isLead: false,
    tenureDays: 0,
    moraleHistory: [],
  };
}

export function generateCandidatePool(day: number, hasHr: boolean, salaryDiscount = 1.0, neededRoles?: Role[]): Employee[] {
  const pool: Employee[] = [];
  // If we know which roles are needed (from in-progress cards missing capacity),
  // bias the pool toward those roles.
  const slots: (Role | undefined)[] = [undefined, undefined, undefined];
  if (neededRoles && neededRoles.length > 0) {
    // First slot: a needed role (priority)
    slots[0] = neededRoles[0];
    // Second slot: another needed role if available, else random
    if (neededRoles.length > 1) {
      slots[1] = neededRoles[1];
    } else {
      slots[1] = undefined;
    }
    // Third slot: random
    slots[2] = undefined;
  } else {
    // Default: bias 3rd slot toward engineering
    slots[2] = forceRoleByNeed();
  }
  for (let i = 0; i < 3; i++) {
    const emp = generateCandidate(day, slots[i], salaryDiscount);
    pool.push(emp);
  }
  return pool;
  function forceRoleByNeed(): Role | undefined {
    // Bias 3rd slot toward engineering or support since those are most-needed
    if (Math.random() < 0.5) {
      const eng: Role[] = ['frontend', 'backend', 'mobile', 'devops', 'qa'];
      return eng[Math.floor(Math.random() * eng.length)];
    }
    return undefined;
  }
}

export function promoteEmployee(emp: Employee): Employee {
  const next: Record<Level, Level | null> = {
    junior: 'mid',
    mid: 'senior',
    senior: 'lead',
    lead: null,
  };
  const nextLevel = next[emp.level];
  if (!nextLevel) return emp;
  return {
    ...emp,
    level: nextLevel,
    salary: Math.round(emp.salary * 1.4),
    skill: Math.min(100, emp.skill + 10),
    isLead: nextLevel === 'lead',
  };
}

export function reassignEmployee(emp: Employee, productId: string | 'shared'): Employee {
  return { ...emp, assignedProductId: productId };
}
