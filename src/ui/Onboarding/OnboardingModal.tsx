import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import type { Role } from '../../types';
import { randomName } from '../../data/names';

const SPECIALIZATIONS: { role: Role; label: string; description: string; icon: string }[] = [
  { role: 'frontend', label: 'Coder — Frontend', description: 'Builds UI. Produces Frontend work-points. Strong at MVP client-side.', icon: '🎨' },
  { role: 'backend', label: 'Coder — Backend', description: 'Builds APIs & infra. Produces Backend work-points. Strong at MVP server-side.', icon: '⚙️' },
  { role: 'ui_ux', label: 'Designer', description: 'Owns UX. Produces Design work-points. Better product score from day 1.', icon: '✨' },
  { role: 'growth_marketer', label: 'Marketer', description: 'Drives growth. Produces Marketing work-points. Faster early traction.', icon: '📣' },
  { role: 'ops_manager', label: 'Ops / Business', description: 'No desk output, but −10% candidate salaries + faster candidate pool refresh.', icon: '📋' },
];

export default function OnboardingModal() {
  const createFounder = useGameStore((s) => s.createFounder);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Role>('frontend');
  const [step, setStep] = useState<0 | 1 | 2>(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-bg-900/95 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="panel max-w-2xl w-full p-6 sm:p-8">
        {step === 0 && (
          <>
            <div className="text-xs uppercase tracking-widest text-accent-cyan mb-1">Welcome to</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-emerald bg-clip-text text-transparent">
              Startup Tycoon
            </h1>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Run a tech company from a $100,000 garage startup to an IPO. Build a portfolio of products
              (SaaS, mobile, desktop, OS) on kanban boards, manage a real org chart, raise funding rounds,
              and watch every hire and upgrade physically appear in your 3D office.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5 text-xs text-slate-400">
              <Bullet>1 tick = 1 in-game day. Pause or speed up anytime.</Bullet>
              <Bullet>One shared cash pool across all your products.</Bullet>
              <Bullet>Every hire shows up in the 3D office.</Bullet>
              <Bullet>Each product has its own kanban + team.</Bullet>
              <Bullet>MVP card must ship before a product launches.</Bullet>
              <Bullet>Hit the IPO valuation target sustained 30 days to win.</Bullet>
            </div>
            <div className="flex justify-end mt-6">
              <button className="btn-primary" onClick={() => setStep(1)}>
                Get Started →
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold">What's your name, founder?</h2>
            <p className="text-slate-400 text-sm mt-1">
              You'll start with $100,000 in the bank and a SaaS product ready to be built.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Founder name"
              className="w-full mt-5 bg-bg-700 border border-white/10 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-accent-cyan"
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) setStep(2); }}
            />
            <button
              className="text-xs text-slate-500 hover:text-slate-300 mt-2"
              onClick={() => setName(randomName())}
            >
              🎲 Random name
            </button>
            <div className="flex justify-between mt-6">
              <button className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn-primary" disabled={!name.trim()} onClick={() => setStep(2)}>
                Next →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold">Pick your specialization</h2>
            <p className="text-slate-400 text-sm mt-1">
              You'll occupy a desk and produce work like a strong Junior / weak Mid in this role.
              You can step back later once a Mid-or-better employee takes over your role.
            </p>
            <div className="grid grid-cols-1 gap-2 mt-5">
              {SPECIALIZATIONS.map((s) => (
                <button
                  key={s.role}
                  onClick={() => setSelected(s.role)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    selected === s.role
                      ? 'bg-accent-cyan/10 border-accent-cyan/50 ring-1 ring-accent-cyan/30'
                      : 'bg-bg-700/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl">{s.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn-primary"
                onClick={() => createFounder(name.trim(), selected)}
              >
                Start the company →
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-accent-cyan mt-0.5">▸</span>
      <span>{children}</span>
    </div>
  );
}
