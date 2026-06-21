import type { FeatureCard, ProductType } from '../../types';
import { SAAS_CATALOG, SAAS_STARTER_UNLOCKED } from './saas.catalog';
import { MOBILE_CATALOG, MOBILE_STARTER_UNLOCKED } from './mobile.catalog';
import { DESKTOP_CATALOG, DESKTOP_STARTER_UNLOCKED } from './desktop.catalog';
import { OS_CATALOG, OS_STARTER_UNLOCKED } from './os.catalog';

export function getCatalog(type: ProductType): FeatureCard[] {
  switch (type) {
    case 'saas':
      return SAAS_CATALOG;
    case 'mobile':
      return MOBILE_CATALOG;
    case 'desktop':
      return DESKTOP_CATALOG;
    case 'os':
      return OS_CATALOG;
  }
}

export function getStarterUnlocked(type: ProductType): string[] {
  switch (type) {
    case 'saas':
      return SAAS_STARTER_UNLOCKED;
    case 'mobile':
      return MOBILE_STARTER_UNLOCKED;
    case 'desktop':
      return DESKTOP_STARTER_UNLOCKED;
    case 'os':
      return OS_STARTER_UNLOCKED;
  }
}

// Build a fresh kanban for a new product: MVP locked-but-unlocked, 2 starter cards in backlog, rest locked
export function buildInitialKanban(type: ProductType): FeatureCard[] {
  const catalog = getCatalog(type);
  const starter = getStarterUnlocked(type);
  return catalog.map((c) => {
    const isMvp = c.effect.isMvp;
    const isStarter = starter.includes(c.id);
    // MVP starts in backlog (can be started immediately). Starters also in backlog. Rest locked.
    const stage = isMvp || isStarter ? 'backlog' : 'locked';
    return { ...c, stage };
  });
}

export { SAAS_CATALOG, MOBILE_CATALOG, DESKTOP_CATALOG, OS_CATALOG };
