import type { Product, UserFeedback } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { motion } from 'framer-motion';

const RATING_STARS = '⭐⭐⭐⭐⭐';

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-accent-rose/20 text-accent-rose',
  feature_request: 'bg-accent-violet/20 text-accent-violet',
  praise: 'bg-accent-emerald/20 text-accent-emerald',
  complaint: 'bg-accent-amber/20 text-accent-amber',
};

export default function QAFeedbackPanel({ product }: { product: Product }) {
  const acknowledge = useGameStore((s) => s.acknowledgeFeedback);
  const feedback = product.feedback.slice(-20).reverse();

  const avgRating = feedback.length > 0
    ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length
    : 0;

  const byCategory = {
    bug: feedback.filter((f) => f.category === 'bug').length,
    feature_request: feedback.filter((f) => f.category === 'feature_request').length,
    praise: feedback.filter((f) => f.category === 'praise').length,
    complaint: feedback.filter((f) => f.category === 'complaint').length,
  };

  return (
    <div className="panel-tight p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">🔬 QA Feedback</div>
        <div className="text-xs text-slate-400">
          {feedback.length} responses · avg {avgRating.toFixed(1)}★
        </div>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        <CategoryChip label="Bugs" count={byCategory.bug} color="bg-accent-rose/20 text-accent-rose" />
        <CategoryChip label="Requests" count={byCategory.feature_request} color="bg-accent-violet/20 text-accent-violet" />
        <CategoryChip label="Praise" count={byCategory.praise} color="bg-accent-emerald/20 text-accent-emerald" />
        <CategoryChip label="Complaints" count={byCategory.complaint} color="bg-accent-amber/20 text-accent-amber" />
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto scroll-thin">
        {feedback.length === 0 && (
          <div className="text-[11px] text-slate-500 p-3 text-center">
            No feedback yet. Feedback will arrive over the coming days.
          </div>
        )}
        {feedback.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`panel-tight p-2 ${f.status === 'new' ? 'border-accent-cyan/30' : 'opacity-70'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500">{f.userName}</span>
                  <span className="text-[10px] text-accent-amber">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                  <span className={`chip ${CATEGORY_COLORS[f.category]} text-[8px]`}>{f.category.replace('_', ' ')}</span>
                  {f.status === 'new' && <span className="chip bg-accent-cyan/20 text-accent-cyan text-[8px]">NEW</span>}
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">{f.comment}</div>
              </div>
              {f.status === 'new' && (
                <button
                  onClick={() => acknowledge(product.id, f.id)}
                  className="text-[9px] text-accent-cyan hover:underline shrink-0"
                >
                  ✓ Ack
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CategoryChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`panel-tight p-1.5 text-center ${count > 0 ? color : 'opacity-40'}`}>
      <div className="text-sm font-bold">{count}</div>
      <div className="text-[9px]">{label}</div>
    </div>
  );
}
