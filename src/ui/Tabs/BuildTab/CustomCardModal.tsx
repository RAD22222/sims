import { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import type { CardCategory, Role, FeatureCardEffect } from '../../../types';
import { ROLE_LABELS } from '../../Tabs/StaffTab/roleLabels';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: { id: CardCategory; label: string; description: string }[] = [
  { id: 'core', label: 'Core', description: 'Core product functionality' },
  { id: 'monetization', label: 'Monetization', description: 'Revenue-generating features' },
  { id: 'growth', label: 'Growth', description: 'Acquisition / virality' },
  { id: 'retention', label: 'Retention', description: 'Reduce churn, increase stickiness' },
  { id: 'compliance', label: 'Compliance', description: 'SOC2, GDPR, SSO, etc.' },
  { id: 'infra', label: 'Infra', description: 'Hosting, scaling, stability' },
  { id: 'polish', label: 'Polish', description: 'UI redesign, dark mode, a11y' },
];

// Engineering roles available for SaaS custom cards
const ENGINEERING_ROLES: Role[] = ['frontend', 'backend', 'devops', 'qa'];
const DESIGN_ROLES: Role[] = ['ui_ux'];
const ALL_AVAILABLE_ROLES: Role[] = [...ENGINEERING_ROLES, ...DESIGN_ROLES];

const EFFECT_PRESETS: { id: string; label: string; apply: (e: FeatureCardEffect) => void; description: string }[] = [
  { id: 'score_small', label: '+3 Score', description: 'Small product score boost', apply: (e) => { e.productScoreDelta = (e.productScoreDelta || 0) + 3; } },
  { id: 'score_med', label: '+6 Score', description: 'Medium product score boost', apply: (e) => { e.productScoreDelta = (e.productScoreDelta || 0) + 6; } },
  { id: 'churn_5', label: '−5% Churn', description: 'Reduce churn 5%', apply: (e) => { e.churnMult = (e.churnMult ?? 1) * 0.95; } },
  { id: 'churn_10', label: '−10% Churn', description: 'Reduce churn 10%', apply: (e) => { e.churnMult = (e.churnMult ?? 1) * 0.9; } },
  { id: 'growth_10', label: '+10% Growth', description: 'Boost user growth 10%', apply: (e) => { e.growthMult = (e.growthMult ?? 1) * 1.1; } },
  { id: 'growth_25', label: '+25% Growth', description: 'Boost user growth 25%', apply: (e) => { e.growthMult = (e.growthMult ?? 1) * 1.25; } },
  { id: 'rev_15', label: '+15% $/user', description: 'More revenue per user', apply: (e) => { e.revenuePerUserMult = (e.revenuePerUserMult ?? 1) * 1.15; } },
  { id: 'rev_30', label: '+30% $/user', description: 'Much more revenue per user', apply: (e) => { e.revenuePerUserMult = (e.revenuePerUserMult ?? 1) * 1.3; } },
  { id: 'support_30', label: '−30% Tickets', description: 'Reduces support ticket volume', apply: (e) => { e.supportTicketReduction = Math.min(0.9, (e.supportTicketReduction ?? 0) + 0.3); } },
];

export default function CustomCardModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const createCustomCard = useGameStore((s) => s.createCustomCard);
  const cash = useGameStore((s) => s.cash);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CardCategory>('core');
  const [cost, setCost] = useState(2000);
  const [roles, setRoles] = useState<{ role: Role; effortDays: number }[]>([{ role: 'frontend', effortDays: 3 }]);
  const [effect, setEffect] = useState<FeatureCardEffect>({});
  const [error, setError] = useState('');

  const totalEffort = roles.reduce((s, r) => s + r.effortDays, 0);

  const addRole = () => {
    setRoles([...roles, { role: 'backend', effortDays: 3 }]);
  };
  const removeRole = (idx: number) => {
    if (roles.length === 1) return;
    setRoles(roles.filter((_, i) => i !== idx));
  };
  const updateRole = (idx: number, field: 'role' | 'effortDays', value: string | number) => {
    setRoles(roles.map((r, i) => (i === idx ? { ...r, [field]: field === 'effortDays' ? Number(value) : value } : r)));
  };

  const applyPreset = (presetId: string) => {
    const preset = EFFECT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newEffect = { ...effect };
    preset.apply(newEffect);
    setEffect(newEffect);
  };

  const handleCreate = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter a feature name.');
      return;
    }
    if (roles.length === 0) {
      setError('Add at least one required role.');
      return;
    }
    if (roles.some((r) => r.effortDays < 1)) {
      setError('Effort days must be at least 1.');
      return;
    }
    if (cost < 0) {
      setError('Cost cannot be negative.');
      return;
    }
    if (cash < cost) {
      setError(`Not enough cash. You have $${cash.toLocaleString()}, need $${cost.toLocaleString()}.`);
      return;
    }

    const totalEffortDays = roles.reduce((s, r) => s + r.effortDays, 0);
    const ok = createCustomCard(productId, {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      requiredRoles: roles,
      cost,
      prereqCardIds: [],
      effect: { ...effect },
      totalEffortDays,
      isCustom: true,
      priority: 0,
    });
    if (ok) {
      onClose();
    } else {
      setError('Failed to create card.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-bg-900/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="panel p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto scroll-thin"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Create Custom Feature</h2>
              <p className="text-slate-400 text-xs mt-1">
                Design your own feature card for the SaaS product backlog. Cost: <span className="text-accent-cyan">${cost.toLocaleString()}</span> · Total effort: <span className="text-accent-cyan">{totalEffort} role-days</span>
              </p>
            </div>
            <button className="btn-ghost text-xs" onClick={onClose}>✕</button>
          </div>

          {/* Name + description */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Feature Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI-powered Recommendations"
                maxLength={50}
                className="w-full bg-bg-700 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One-line description"
                maxLength={100}
                className="w-full bg-bg-700 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <div className="grid grid-cols-4 gap-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-2 rounded-md text-xs font-medium transition-all border ${
                      category === c.id
                        ? `chip-${c.id} border-current`
                        : 'bg-bg-700/60 border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                    title={c.description}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost */}
            <div>
              <label className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                <span>Cost ($)</span>
                <span className="text-accent-emerald">${cost.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full accent-accent-cyan"
              />
            </div>

            {/* Required roles */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">Required Roles & Effort</label>
                <button onClick={addRole} className="btn-ghost text-[10px]">+ Add role</button>
              </div>
              <div className="space-y-1">
                {roles.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={r.role}
                      onChange={(e) => updateRole(idx, 'role', e.target.value)}
                      className="bg-bg-700 border border-white/10 rounded px-2 py-1 text-xs flex-1 focus:outline-none"
                    >
                      {ALL_AVAILABLE_ROLES.map((role) => (
                        <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={r.effortDays}
                      onChange={(e) => updateRole(idx, 'effortDays', e.target.value)}
                      className="bg-bg-700 border border-white/10 rounded px-2 py-1 text-xs w-16 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">days</span>
                    {roles.length > 1 && (
                      <button
                        onClick={() => removeRole(idx)}
                        className="text-slate-500 hover:text-accent-rose text-xs px-1"
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Effect presets */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Effects (click to stack)</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {EFFECT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className="chip bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan text-[10px]"
                    title={p.description}
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
              {/* Current effect summary */}
              <EffectSummary effect={effect} onReset={() => setEffect({})} />
            </div>

            {error && (
              <div className="text-xs text-accent-rose bg-accent-rose/10 p-2 rounded">{error}</div>
            )}
          </div>

          <div className="flex justify-between items-center mt-5">
            <div className="text-xs text-slate-500">Cost: ${cost.toLocaleString()} · After: ${(cash - cost).toLocaleString()}</div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn-primary"
                disabled={!name.trim() || cash < cost}
                onClick={handleCreate}
              >
                Add to Backlog
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function EffectSummary({ effect, onReset }: { effect: FeatureCardEffect; onReset: () => void }) {
  const parts: string[] = [];
  if (effect.productScoreDelta) parts.push(`+${effect.productScoreDelta} score`);
  if (effect.churnMult && effect.churnMult < 1) parts.push(`−${((1 - effect.churnMult) * 100).toFixed(0)}% churn`);
  if (effect.growthMult && effect.growthMult > 1) parts.push(`+${((effect.growthMult - 1) * 100).toFixed(0)}% growth`);
  if (effect.revenuePerUserMult && effect.revenuePerUserMult > 1) parts.push(`+${((effect.revenuePerUserMult - 1) * 100).toFixed(0)}% $/user`);
  if (effect.supportTicketReduction) parts.push(`−${(effect.supportTicketReduction * 100).toFixed(0)}% tickets`);
  if (effect.unlocksMonetizationTier) parts.push(`Unlock ${effect.unlocksMonetizationTier}`);
  if (effect.customEffect) parts.push(effect.customEffect);

  if (parts.length === 0) {
    return <div className="text-[10px] text-slate-600 italic">No effects selected yet — card will still ship but won't impact metrics.</div>;
  }
  return (
    <div className="panel-tight p-2 flex items-center justify-between">
      <div className="text-[11px] text-slate-300">
        <span className="text-slate-500 mr-1">Current effects:</span>
        {parts.join(' · ')}
      </div>
      <button onClick={onReset} className="text-[10px] text-accent-rose hover:underline">Reset</button>
    </div>
  );
}
