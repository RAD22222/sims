import { useGameStore } from '../../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

function formatMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n).toLocaleString()}`;
}

export default function Hud() {
  const day = useGameStore((s) => s.day);
  const cash = useGameStore((s) => s.cash);
  const isPaused = useGameStore((s) => s.isPaused);
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const setPaused = useGameStore((s) => s.setPaused);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const staff = useGameStore((s) => s.staff);
  const products = useGameStore((s) => s.products);
  const funding = useGameStore((s) => s.funding);
  const pendingFundingOffer = useGameStore((s) => s.pendingFundingOffer);
  const officeTier = useGameStore((s) => s.officeTier);
  const hardReset = useGameStore((s) => s.hardReset);

  const totalUsers = products.reduce((s, p) => s + p.users, 0);
  const totalMrr = products.reduce((s, p) => s + p.mrr, 0);
  const latestFunding = funding[funding.length - 1];

  // Pseudo-date display
  const startDate = new Date(2025, 0, 1);
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + day);

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-bg-800/90 backdrop-blur-md z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center font-bold text-bg-900 text-sm">
            ST
          </div>
          <div className="text-xs text-slate-400 leading-tight">
            <div className="text-slate-200 font-semibold">Startup Tycoon</div>
            <div>Day {day} · {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-3 text-sm">
          <Stat label="Cash" value={formatMoney(cash)} valueClass={cash < 0 ? 'text-accent-rose' : cash < 50_000 ? 'text-accent-amber' : 'text-accent-emerald'} />
          <Stat label="Users" value={formatNumber(totalUsers)} />
          <Stat label="MRR" value={formatMoney(totalMrr)} />
          <Stat label="Headcount" value={`${staff.length}${useGameStore.getState().founder.hasSteppedBack ? '' : '+1'}`} />
          <Stat label="Office" value={officeTier} valueClass="capitalize" />
          {latestFunding && (
            <Stat
              label={`Series ${'ABC'[latestFunding.roundNumber - 1]} Conf.`}
              value={`${Math.round(latestFunding.investorConfidence)}%`}
              valueClass={latestFunding.investorConfidence < 30 ? 'text-accent-rose' : ''}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {pendingFundingOffer && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="btn bg-accent-amber/90 text-bg-900 hover:bg-accent-amber pulse-glow"
              onClick={() => {
                if (typeof window !== 'undefined') (window as any).__openFundingModal?.();
              }}
            >
              Funding Offer Available!
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1 bg-bg-700/80 rounded-md p-1">
          <button
            className={`px-2 py-1 rounded text-xs font-semibold ${isPaused ? 'bg-accent-cyan text-bg-900' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setPaused(true)}
            title="Pause"
          >
            ❚❚
          </button>
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              className={`px-2 py-1 rounded text-xs font-semibold ${!isPaused && gameSpeed === s ? 'bg-accent-cyan text-bg-900' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setSpeed(s as 1 | 2 | 3)}
              title={`${s}x speed`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          className="btn-ghost text-xs"
          onClick={() => {
            if (confirm('Reset the entire game? Save will be wiped.')) hardReset();
          }}
          title="Reset save"
        >
          ↺
        </button>
      </div>
    </header>
  );
}

function Stat({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
