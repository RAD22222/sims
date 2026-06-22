import { useGameStore } from '../../store/useGameStore';
import { motion } from 'framer-motion';

export default function GameOverScreen() {
  const reason = useGameStore((s) => s.gameOverReason);
  const day = useGameStore((s) => s.day);
  const cash = useGameStore((s) => s.cash);
  const products = useGameStore((s) => s.products);
  const totalRevenueAllTime = useGameStore((s) => s.totalRevenueAllTime);
  const hardReset = useGameStore((s) => s.hardReset);
  const staff = useGameStore((s) => s.staff);

  const totalUsers = products.reduce((s, p) => s + p.users, 0);
  const totalMrr = products.reduce((s, p) => s + p.mrr, 0);

  const config = reason === 'ipo'
    ? { title: '🎉 IPO!', subtitle: `You took your company public after ${day} days.`, color: 'from-accent-emerald to-accent-cyan', body: 'A legendary run — investors are cheering.' }
    : reason === 'bankruptcy'
    ? { title: '💀 Bankruptcy', subtitle: `Cash ran dry on day ${day}.`, color: 'from-accent-rose to-amber-600', body: 'The runway ran out. The dream is over — for now.' }
    : { title: '⚠️ Investor Takeover', subtitle: `Investors lost confidence on day ${day}.`, color: 'from-accent-amber to-accent-rose', body: 'The board has replaced you. Time to start something new.' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-bg-900/95 backdrop-blur-xl flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="panel p-8 max-w-lg w-full mx-4"
      >
        <div className={`text-3xl font-extrabold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
          {config.title}
        </div>
        <div className="text-slate-300 mt-1">{config.subtitle}</div>
        <div className="text-slate-400 mt-4 text-sm">{config.body}</div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <StatBox label="Days Survived" value={`${day}`} />
          <StatBox label="Final Cash" value={`$${cash.toLocaleString()}`} />
          <StatBox label="Total Users" value={totalUsers.toLocaleString()} />
          <StatBox label="MRR" value={`$${totalMrr.toLocaleString()}/mo`} />
          <StatBox label="Lifetime Revenue" value={`$${totalRevenueAllTime.toLocaleString()}`} />
          <StatBox label="Peak Headcount" value={`${staff.length}`} />
          <StatBox label="Products Launched" value={`${products.filter((p) => p.launchDate !== null).length}`} />
          <StatBox label="Products Sunset" value={`${products.filter((p) => p.status === 'sunset').length}`} />
        </div>

        <button
          className="btn-primary w-full mt-6 py-3"
          onClick={() => hardReset()}
        >
          Start New Game
        </button>
      </motion.div>
    </motion.div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-tight p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}
