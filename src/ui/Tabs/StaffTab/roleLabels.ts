import type { Role } from '../../../types';

export const ROLE_LABELS: Record<Role, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  mobile: 'Mobile Dev',
  devops: 'DevOps',
  qa: 'QA',
  ui_ux: 'UI/UX Designer',
  product_designer: 'Product Designer',
  product_manager: 'Product Manager',
  growth_marketer: 'Growth Marketer',
  content_marketer: 'Content Marketer',
  performance_marketer: 'Performance Marketer',
  sales_rep: 'Sales Rep',
  account_exec: 'Account Exec',
  support_rep: 'Support Rep',
  hr_manager: 'HR Manager',
  ops_manager: 'Ops Manager',
};

export const ROLE_COLORS: Record<Role, string> = {
  frontend: 'bg-accent-cyan/20 text-accent-cyan',
  backend: 'bg-emerald-400/20 text-emerald-300',
  mobile: 'bg-blue-400/20 text-blue-300',
  devops: 'bg-amber-400/20 text-amber-300',
  qa: 'bg-pink-400/20 text-pink-300',
  ui_ux: 'bg-violet-400/20 text-violet-300',
  product_designer: 'bg-violet-400/20 text-violet-300',
  product_manager: 'bg-rose-400/20 text-rose-300',
  growth_marketer: 'bg-yellow-400/20 text-yellow-300',
  content_marketer: 'bg-yellow-400/20 text-yellow-300',
  performance_marketer: 'bg-yellow-400/20 text-yellow-300',
  sales_rep: 'bg-teal-400/20 text-teal-300',
  account_exec: 'bg-teal-400/20 text-teal-300',
  support_rep: 'bg-slate-400/20 text-slate-300',
  hr_manager: 'bg-orange-400/20 text-orange-300',
  ops_manager: 'bg-lime-400/20 text-lime-300',
};
