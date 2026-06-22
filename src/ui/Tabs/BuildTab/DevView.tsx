import { useGameStore } from '../../../store/useGameStore';
import type { Product } from '../../../types';
import { motion } from 'framer-motion';
import BetaTestersPanel from './BetaTestersPanel';
import QAFeedbackPanel from './QAFeedbackPanel';
import DevPreview from './DevPreview';

const STAGES = [
  { id: 'pre_launch', label: 'Prototype', icon: '🔨', color: 'bg-slate-500' },
  { id: 'beta', label: 'Beta', icon: '🧪', color: 'bg-accent-amber' },
  { id: 'qa', label: 'QA', icon: '🔬', color: 'bg-accent-violet' },
  { id: 'release_ready', label: 'Ready', icon: '✅', color: 'bg-accent-emerald' },
  { id: 'live', label: 'Live', icon: '🚀', color: 'bg-accent-cyan' },
];

export default function DevView({ product }: { product: Product }) {
  const startBeta = useGameStore((s) => s.startBetaTesting);
  const startQA = useGameStore((s) => s.startQA);
  const markReleaseReady = useGameStore((s) => s.markReleaseReady);
  const releaseProduct = useGameStore((s) => s.releaseProduct);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const cash = useGameStore((s) => s.cash);

  const mvpShipped = product.kanban.some((c) => c.effect.isMvp && c.stage === 'shipped');
  const currentStageIdx = STAGES.findIndex((s) => s.id === product.status);
  const openBugs = product.bugs.filter((b) => b.status === 'open').length;
  const activeTesters = product.betaTesters.filter((t) => t.active && t.daysRemaining > 0).length;

  return (
    <div className="flex-1 panel p-3 overflow-y-auto scroll-thin flex flex-col gap-3">
      {/* Stage progress bar */}
      <div className="flex items-center gap-1">
        {STAGES.map((stage, idx) => {
          const isCurrent = stage.id === product.status;
          const isPast = idx < currentStageIdx;
          const isFuture = idx > currentStageIdx;
          return (
            <div key={stage.id} className="flex-1 flex items-center gap-1">
              <motion.div
                animate={{ scale: isCurrent ? 1.05 : 1 }}
                className={`flex-1 panel-tight p-2 text-center ${
                  isCurrent ? `ring-1 ring-accent-cyan ${stage.color}/20` : ''
                } ${isPast ? 'opacity-60' : ''} ${isFuture ? 'opacity-40' : ''}`}
              >
                <div className="text-lg">{stage.icon}</div>
                <div className={`text-[10px] font-medium ${isCurrent ? 'text-accent-cyan' : 'text-slate-400'}`}>
                  {stage.label}
                </div>
              </motion.div>
              {idx < STAGES.length - 1 && <div className={`w-2 h-px ${isPast ? 'bg-accent-emerald' : 'bg-white/10'}`} />}
            </div>
          );
        })}
      </div>

      {/* Stage-specific content */}
      {product.status === 'pre_launch' && (
        <div className="space-y-3">
          <div className="panel-tight p-3">
            <div className="text-sm font-semibold mb-1">🔨 Prototype Phase</div>
            <div className="text-xs text-slate-400">
              {mvpShipped
                ? 'MVP shipped! You can now start Beta Testing to find bugs before going live.'
                : 'Build the MVP / Prototype card to complete this phase. Hire Frontend + Backend + UI/UX staff from the Staff tab.'}
            </div>
          </div>

          <DevPreview product={product} />

          {mvpShipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel-tight p-3 border-accent-amber/30 bg-accent-amber/5"
            >
              <div className="text-sm font-semibold text-accent-amber mb-2">🧪 Ready for Beta Testing</div>
              <div className="text-xs text-slate-400 mb-3">
                Hire beta testers to find bugs before releasing. They charge daily and find bugs based on their skill.
                Fix all bugs before starting QA.
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="btn-primary text-xs"
                  onClick={() => startBeta(product.id, 3, 10)}
                  disabled={cash < 3 * 300 * 10}
                  title={`3 testers × 10 days ≈ $${(3 * 300 * 10).toLocaleString()}`}
                >
                  🧪 Start Beta (3 testers, 10 days) ≈ ${9_000}
                </button>
                <button
                  className="btn-secondary text-xs"
                  onClick={() => startBeta(product.id, 5, 14)}
                  disabled={cash < 5 * 300 * 14}
                  title={`5 testers × 14 days ≈ $${(5 * 300 * 14).toLocaleString()}`}
                >
                  Bigger Beta (5 testers, 14 days) ≈ ${21_000}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {product.status === 'beta' && (
        <div className="space-y-3">
          <div className="panel-tight p-3 border-accent-amber/30 bg-accent-amber/5">
            <div className="text-sm font-semibold text-accent-amber mb-1">🧪 Beta Testing In Progress</div>
            <div className="text-xs text-slate-400">
              {activeTesters} active tester{activeTesters === 1 ? '' : 's'} finding bugs. Fix all {openBugs} open bug{openBugs === 1 ? '' : 's'} before starting QA.
            </div>
          </div>

          <DevPreview product={product} />

          <BetaTestersPanel product={product} />

          {openBugs === 0 && activeTesters === 0 && (
            <motion.button
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="btn-primary w-full py-3"
              onClick={() => startQA(product.id)}
            >
              🔬 Start QA Phase (collect developer & customer feedback)
            </motion.button>
          )}
          {openBugs === 0 && activeTesters > 0 && (
            <div className="text-xs text-slate-400 text-center p-2">
              Wait for beta testers to finish ({activeTesters} active), or start QA now if you're confident.
              <button className="btn-secondary text-xs block mx-auto mt-2" onClick={() => startQA(product.id)}>
                Start QA Anyway
              </button>
            </div>
          )}
          {openBugs > 0 && (
            <div className="text-xs text-accent-rose text-center p-2 panel-tight">
              ⚠ Fix all {openBugs} open bug{openBugs === 1 ? '' : 's'} first (see right column →)
            </div>
          )}
        </div>
      )}

      {product.status === 'qa' && (
        <div className="space-y-3">
          <div className="panel-tight p-3 border-accent-violet/30 bg-accent-violet/5">
            <div className="text-sm font-semibold text-accent-violet mb-1">🔬 QA Phase</div>
            <div className="text-xs text-slate-400">
              Developers and customers are providing feedback. Address issues, then mark Release Ready.
            </div>
          </div>

          <DevPreview product={product} />

          <QAFeedbackPanel product={product} />

          <motion.button
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="btn-primary w-full py-3"
            onClick={() => markReleaseReady(product.id)}
          >
            ✅ Mark Release Ready
          </motion.button>
        </div>
      )}

      {product.status === 'release_ready' && (
        <div className="space-y-3">
          <div className="panel-tight p-3 border-accent-emerald/30 bg-accent-emerald/5">
            <div className="text-sm font-semibold text-accent-emerald mb-1">✅ Release Ready!</div>
            <div className="text-xs text-slate-400">
              Set up domain, database, SSL, and CDN in the Product tab to go live.
            </div>
          </div>

          <DevPreview product={product} />

          <div className="panel-tight p-3">
            <div className="text-xs font-semibold text-slate-300 mb-2">📋 Pre-Launch Checklist:</div>
            <div className="space-y-1 text-xs">
              <ChecklistItem done={!!product.domain} label={`Domain: ${product.domain || 'not set'}`} />
              <ChecklistItem done={product.sslEnabled} label={`SSL Certificate: ${product.sslEnabled ? 'enabled' : 'disabled'}`} />
              <ChecklistItem done={product.databaseType !== 'none'} label={`Database: ${product.databaseType}`} />
              <ChecklistItem done={true} label={`Hosting: ${product.hostingPlanId}`} />
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-secondary text-xs flex-1" onClick={() => setActiveTab('product')}>
                → Configure in Product Tab
              </button>
              <button
                className="btn-primary text-xs flex-1"
                disabled={!product.domain || !product.sslEnabled}
                onClick={() => releaseProduct(product.id)}
                title={!product.domain ? 'Need domain' : !product.sslEnabled ? 'Need SSL' : 'Go live!'}
              >
                🚀 Release to Live
              </button>
            </div>
          </div>
        </div>
      )}

      {(product.status === 'live' || product.status === 'scaling') && (
        <div className="space-y-3">
          <div className="panel-tight p-3 border-accent-cyan/30 bg-accent-cyan/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-accent-cyan">🚀 Live at {product.domain}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {product.users.toLocaleString()} users · ${product.mrr.toLocaleString()}/mo MRR · {product.avgRating}★
                </div>
              </div>
              <button
                className="btn-secondary text-xs"
                onClick={() => setActiveTab('product_page')}
              >
                → Product Page
              </button>
            </div>
          </div>

          <DevPreview product={product} />

          {openBugs > 0 && (
            <div className="panel-tight p-3 border-accent-rose/30 bg-accent-rose/5">
              <div className="text-xs text-accent-rose">
                ⚠ {openBugs} live bug{openBugs === 1 ? '' : 's'} reported by users. Fix them in the right column →
              </div>
            </div>
          )}
        </div>
      )}

      {product.status === 'sunset' && (
        <div className="panel-tight p-3 text-center text-slate-500">
          This product has been sunset.
        </div>
      )}
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${done ? 'text-accent-emerald' : 'text-slate-400'}`}>
      <span>{done ? '✓' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}
