import type { FeatureCard, Product } from '../../../types';
import KanbanCard from './KanbanCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  title: string;
  cards: FeatureCard[];
  product: Product;
  accent: string;
  emptyText?: string;
}

export default function KanbanColumn({ title, cards, product, accent, emptyText }: Props) {
  return (
    <div className="flex flex-col gap-2 min-w-[260px] w-[280px] flex-1 panel p-2 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${accent}`} />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="text-[10px] text-slate-500">{cards.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin space-y-2 pr-1">
        <AnimatePresence>
          {cards.length === 0 ? (
            <div className="text-[11px] text-slate-600 p-3 text-center">{emptyText || 'Empty'}</div>
          ) : (
            cards.map((card) => (
              <KanbanCard key={card.id} card={card} product={product} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
