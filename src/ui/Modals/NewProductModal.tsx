import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { ProductType, SaasTemplate } from '../../types';
import { SAAS_TEMPLATES, getTemplate } from '../../data/catalogs/saasTemplates';
import { motion, AnimatePresence } from 'framer-motion';
import { randomCompanyName } from '../../data/names';

export default function NewProductModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<SaasTemplate>('project_mgmt');
  const [selectedStarters, setSelectedStarters] = useState<string[]>([]);

  const products = useGameStore((s) => s.products);
  const cash = useGameStore((s) => s.cash);
  const createProduct = useGameStore((s) => s.createProduct);

  // Expose opener globally
  if (typeof window !== 'undefined') {
    (window as any).__openNewProductModal = () => {
      setStep(1);
      setName('');
      setTemplate('project_mgmt');
      setSelectedStarters([]);
      setOpen(true);
    };
  }

  const tmpl = getTemplate(template);
  const starterCost = tmpl.starterFeatures
    .filter((sf) => selectedStarters.includes(sf.id))
    .reduce((s, sf) => s + sf.cost, 0);
  const totalCost = 10_000 + starterCost; // NPI fee + selected starters

  const toggleStarter = (id: string) => {
    setSelectedStarters((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const ok = createProduct(name.trim(), 'saas', template, selectedStarters);
    if (ok) {
      setOpen(false);
      setName('');
      setStep(1);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-bg-900/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="panel p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto scroll-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-accent-cyan' : 'bg-white/10'}`} />
              ))}
            </div>

            {step === 1 && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">New SaaS Product</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Pick a product template. Each comes with starter features + a day-based roadmap.
                      NPI fee: <span className="text-accent-cyan">$10,000</span>. Current cash: <span className="text-accent-emerald">${cash.toLocaleString()}</span>
                    </p>
                  </div>
                  <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-5">
                  {SAAS_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTemplate(t.id); setSelectedStarters([]); }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        template === t.id
                          ? 'bg-accent-cyan/10 border-accent-cyan/50 ring-1 ring-accent-cyan/30'
                          : 'bg-bg-700/60 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{t.icon}</span>
                        <span className="font-semibold text-sm">{t.label}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{t.description}</div>
                      <div className="text-[10px] text-slate-500 mt-2">
                        {t.starterFeatures.length} starter features · {t.roadmap.length} roadmap items
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-5">
                  <div className="text-xs text-slate-500">For now, only SaaS products are available.</div>
                  <button className="btn-primary" onClick={() => setStep(2)}>Next →</button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Product Name & Starter Features</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Template: <span className="text-accent-cyan">{tmpl.icon} {tmpl.label}</span>. Name your product and pick which starter features to include.
                    </p>
                  </div>
                  <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>✕</button>
                </div>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name (e.g. Taskflow, Pipelined, Chartwise...)"
                  className="w-full mt-4 bg-bg-700 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                />
                <button
                  className="text-xs text-slate-500 hover:text-slate-300 mt-1"
                  onClick={() => setName(randomCompanyName())}
                >🎲 Random</button>

                <div className="mt-4">
                  <div className="text-xs text-slate-400 mb-2">Starter Features (optional — you can build these later too):</div>
                  <div className="space-y-2">
                    {tmpl.starterFeatures.map((sf) => {
                      const selected = selectedStarters.includes(sf.id);
                      return (
                        <button
                          key={sf.id}
                          onClick={() => toggleStarter(sf.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${
                            selected ? 'bg-accent-emerald/10 border-accent-emerald/40' : 'bg-bg-700/60 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center ${
                            selected ? 'bg-accent-emerald border-accent-emerald' : 'border-slate-500'
                          }`}>
                            {selected && <span className="text-bg-900 text-xs font-bold">✓</span>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{sf.name}</span>
                              <span className="text-xs text-accent-emerald">${sf.cost.toLocaleString()}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{sf.description}</div>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {sf.roles.map((r) => (
                                <span key={r} className="chip bg-white/5 text-slate-400 text-[9px] capitalize">{r.replace('_', ' ')}</span>
                              ))}
                              <span className="text-[10px] text-slate-500">{sf.effortDays}d effort</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5">
                  <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400">
                      Total: <span className="text-accent-cyan font-semibold">${totalCost.toLocaleString()}</span>
                      <span className="text-slate-500 ml-2">(${(10000).toLocaleString()} NPI + ${starterCost.toLocaleString()} starters)</span>
                    </div>
                    <button className="btn-primary" onClick={() => setStep(3)} disabled={!name.trim()}>Next →</button>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Review & Create</h2>
                    <p className="text-slate-400 text-sm mt-1">After creation, hire Frontend, Backend, and Design staff to build the MVP.</p>
                  </div>
                  <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>✕</button>
                </div>

                <div className="panel-tight p-3 mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Product name:</span><span className="font-medium">{name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Type:</span><span className="font-medium">SaaS</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Template:</span><span className="font-medium">{tmpl.icon} {tmpl.label}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Starter features:</span><span className="font-medium">{selectedStarters.length} selected</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Roadmap features:</span><span className="font-medium">{tmpl.roadmap.length} (unlock over time)</span></div>
                  <div className="border-t border-white/5 pt-2 flex justify-between">
                    <span className="text-slate-400">Total cost:</span>
                    <span className="font-bold text-accent-cyan">${totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cash after:</span>
                    <span className={`font-bold ${(cash - totalCost) < 0 ? 'text-accent-rose' : 'text-accent-emerald'}`}>${(cash - totalCost).toLocaleString()}</span>
                  </div>
                </div>

                <div className="panel-tight p-3 mt-3 bg-accent-violet/5 border-accent-violet/20">
                  <div className="text-xs font-semibold text-accent-violet mb-1">📋 Next steps after creation:</div>
                  <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside">
                    <li>Go to <span className="text-accent-cyan">Staff</span> tab — hire Frontend, Backend & UI/UX staff</li>
                    <li>Go to <span className="text-accent-cyan">Build</span> tab — start the <span className="text-accent-violet">MVP / Prototype</span> card</li>
                    <li>Once MVP ships → start <span className="text-accent-amber">Beta Testing</span> (hire beta testers)</li>
                    <li>Fix all bugs → start <span className="text-accent-cyan">QA</span> phase (get feedback)</li>
                    <li>Mark <span className="text-accent-emerald">Release Ready</span> → set up domain/hosting/database</li>
                    <li>Go <span className="text-accent-emerald">Live</span>!</li>
                  </ol>
                </div>

                <div className="flex justify-between items-center mt-5">
                  <button className="btn-ghost" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn-primary"
                    disabled={!name.trim() || cash < totalCost}
                    onClick={handleCreate}
                  >
                    Create Product (${totalCost.toLocaleString()})
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
