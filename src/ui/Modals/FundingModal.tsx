import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function FundingModal() {
  const [dismissed, setDismissed] = useState(false);
  const pendingOffer = useGameStore((s) => s.pendingFundingOffer);
  const accept = useGameStore((s) => s.acceptPendingFunding);
  const reject = useGameStore((s) => s.rejectPendingFunding);
  const day = useGameStore((s) => s.day);
  const cash = useGameStore((s) => s.cash);
  const funding = useGameStore((s) => s.funding);
  const products = useGameStore((s) => s.products);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  const open = pendingOffer !== null && !dismissed;
  // Reset dismissed when a new offer arrives
  if (pendingOffer && dismissed && funding.length === 0) setDismissed(false);

  const totalUsers = products.reduce((s, p) => s + p.users, 0);
  const totalMrr = products.reduce((s, p) => s + p.mrr, 0);

  const handleAccept = () => {
    accept();
    setDismissed(false);
  };
  const handleReject = () => {
    reject();
    setDismissed(true);
  };

  // Also allow opening from product tab via window event
  if (typeof window !== 'undefined') {
    (window as any).__openFundingModal = () => setDismissed(false);
  }

  return (
    <AnimatePresence>
      {open && pendingOffer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-bg-900/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="panel p-6 max-w-lg w-full"
          >
            <div className="text-xs uppercase tracking-widest text-accent-amber mb-1">Term Sheet</div>
            <h2 className="text-2xl font-bold">
              Series {['A', 'B', 'C'][pendingOffer.roundNumber - 1]} Offer
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Investors are offering capital in exchange for equity, with a growth target.
              Missing the target repeatedly will erode investor confidence — hitting zero triggers a takeover.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <TermBox label="Cash Raised" value={`$${(pendingOffer.cashRaised / 1_000_000).toFixed(1)}M`} accent="emerald" />
              <TermBox label="Equity Given" value={`${pendingOffer.equityGiven}%`} accent="violet" />
              <TermBox
                label="Growth Target"
                value={
                  pendingOffer.growthTarget
                    ? pendingOffer.growthTarget.metric === 'users'
                      ? `${pendingOffer.growthTarget.threshold.toLocaleString()} users`
                      : `$${pendingOffer.growthTarget.threshold.toLocaleString()}/mo`
                    : '—'
                }
                accent="cyan"
              />
              <TermBox
                label="Deadline"
                value={pendingOffer.growthTarget ? `Day ${pendingOffer.growthTarget.deadlineDay} (${pendingOffer.growthTarget.deadlineDay - day} days)` : '—'}
                accent="amber"
              />
            </div>

            <div className="panel-tight p-3 mt-4">
              <div className="text-xs text-slate-400 mb-1">Current traction</div>
              <div className="flex justify-between text-sm">
                <span>Users: <span className="text-slate-200 font-semibold">{totalUsers.toLocaleString()}</span></span>
                <span>MRR: <span className="text-slate-200 font-semibold">${totalMrr.toLocaleString()}/mo</span></span>
                <span>Cash: <span className="text-slate-200 font-semibold">${cash.toLocaleString()}</span></span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={handleReject}>Reject</button>
              <button className="btn-primary" onClick={handleAccept}>Accept Funding</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TermBox({ label, value, accent }: { label: string; value: string; accent: 'emerald' | 'violet' | 'cyan' | 'amber' }) {
  const color = {
    emerald: 'text-accent-emerald',
    violet: 'text-accent-violet',
    cyan: 'text-accent-cyan',
    amber: 'text-accent-amber',
  }[accent];
  return (
    <div className="panel-tight p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
