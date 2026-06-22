import type { HostingPlan } from '../../types';

export const HOSTING_PLANS: HostingPlan[] = [
  {
    id: 'shared',
    name: 'Shared Hosting',
    costMonthly: 50,
    capacity: 500,
    autoScales: false,
    description: 'Cheap shared hosting. Hard cap at 500 users — overload beyond that.',
    productTypes: ['saas'],
  },
  {
    id: 'vps',
    name: 'Cloud VPS',
    costMonthly: 400,
    capacity: 5000,
    autoScales: false,
    description: 'Dedicated VPS. Manual upgrade needed near 5K users.',
    productTypes: ['saas'],
  },
  {
    id: 'autoscale',
    name: 'Auto-Scale Cloud',
    costMonthly: 1800,
    capacity: 100000,
    autoScales: true,
    description: 'Auto-scales with load. Handles up to 100K users.',
    productTypes: ['saas', 'mobile'],
  },
  {
    id: 'baremetal',
    name: 'Bare-Metal Cluster',
    costMonthly: 9000,
    capacity: 5000000,
    autoScales: false,
    description: 'Massive bare-metal cluster. Requires DevOps to operate efficiently.',
    productTypes: ['saas', 'os'],
  },
  {
    id: 'license',
    name: 'License/Update Server',
    costMonthly: 120,
    capacity: 99999999,
    autoScales: false,
    description: 'License + update distribution server for desktop apps. Not traffic-bound.',
    productTypes: ['desktop'],
  },
  {
    id: 'mobile_cdn',
    name: 'Mobile Backend + CDN',
    costMonthly: 250,
    capacity: 200000,
    autoScales: true,
    description: 'Mobile backend with CDN. Auto-scales for viral installs.',
    productTypes: ['mobile'],
  },
];

export function getHostingPlan(id: string): HostingPlan {
  return HOSTING_PLANS.find((p) => p.id === id) || HOSTING_PLANS[0];
}
