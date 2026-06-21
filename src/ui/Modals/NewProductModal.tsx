import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { ProductType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { randomCompanyName } from '../../data/names';

const PRODUCT_TYPES: { type: ProductType; label: string; icon: string; description: string; fee: number; }[] = [
  { type: 'saas', label: 'SaaS Web App', icon: '🌐', description: 'Web-based subscription product. Cheapest to start, scales well.', fee: 25_000 },
  { type: 'mobile', label: 'Mobile App', icon: '📱', description: 'Android-first mobile app with IAP / subscription monetization.', fee: 25_000 },
  { type: 'desktop', label: 'Desktop App', icon: '🖥️', description: 'Windows-first native app. License or subscription revenue.', fee: 25_000 },
  { type: 'os', label: 'Operating System', icon: '💿', description: 'Mega-project. Requires 2+ successful products already launched.', fee: 25_000 },
];

export default function NewProductModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('saas');
  const products = useGameStore((s) => s.products);
  const cash = useGameStore((s) => s.cash);
  const createProduct = useGameStore((s) => s.createProduct);

  // Open the modal via a global event listener — we expose a button in the BuildTab header
  // For simplicity, expose a window event-based opener.
  if (typeof window !== 'undefined') {
    (window as any).__openNewProductModal = () => setOpen(true);
  }

  const canLaunch = (t: ProductType) => {
    if (t === 'os') {
      const successful = products.filter((p) => p.launchDate !== null && p.users > 1000);
      return successful.length >= 2;
    }
    return true;
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const ok = createProduct(name.trim(), type);
    if (ok) {
      setOpen(false);
      setName('');
      setType('saas');
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
            className="panel p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">New Product Initiative</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Launch a new product line. Costs <span className="text-accent-cyan font-semibold">$25,000</span>.
                  You'll need to staff it from new hires or reassignment. Current cash: <span className="text-accent-emerald">${cash.toLocaleString()}</span>
                </p>
              </div>
              <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>✕</button>
            </div>

            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product name (e.g. Pixelflow, Hypertrack...)"
              className="w-full mt-4 bg-bg-700 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
            />
            <button
              className="text-xs text-slate-500 hover:text-slate-300 mt-1"
              onClick={() => setName(randomCompanyName())}
            >
              🎲 Random
            </button>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {PRODUCT_TYPES.map((p) => {
                const allowed = canLaunch(p.type);
                return (
                  <button
                    key={p.type}
                    disabled={!allowed}
                    onClick={() => setType(p.type)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      type === p.type
                        ? 'bg-accent-cyan/10 border-accent-cyan/50'
                        : allowed
                        ? 'bg-bg-700/60 border-white/5 hover:border-white/20'
                        : 'bg-bg-700/30 border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.icon}</span>
                      <span className="font-semibold text-sm">{p.label}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{p.description}</div>
                    {!allowed && <div className="text-[10px] text-accent-rose mt-1">🔒 Requires 2+ successful products</div>}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-5">
              <div className="text-xs text-slate-500">Cost: $25,000 · After: ${(cash - 25000).toLocaleString()}</div>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button
                  className="btn-primary"
                  disabled={!name.trim() || cash < 25000}
                  onClick={handleCreate}
                >
                  Launch Product
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
