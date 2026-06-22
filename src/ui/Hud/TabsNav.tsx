import { useGameStore } from '../../store/useGameStore';
import { AnimatePresence, motion } from 'framer-motion';

const TABS = [
  { id: 'office', label: 'Office', icon: '🏢' },
  { id: 'build', label: 'Build', icon: '📐' },
  { id: 'product', label: 'Products', icon: '⚙️' },
  { id: 'product_page', label: 'Live Page', icon: '📈' },
  { id: 'staff', label: 'Staff', icon: '👥' },
] as const;

export default function TabsNav() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const products = useGameStore((s) => s.products);
  const pendingFundingOffer = useGameStore((s) => s.pendingFundingOffer);
  const unreadNotifs = useGameStore((s) => s.notifications.filter((n) => !n.read).length);

  return (
    <nav className="flex items-center justify-between border-b border-white/5 bg-bg-800/60 px-2 z-10">
      <div className="flex items-center">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const disabled = (tab.id === 'build' || tab.id === 'product' || tab.id === 'product_page') && products.length === 0;
          return (
            <button
              key={tab.id}
              disabled={disabled}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'text-accent-cyan' : disabled ? 'text-slate-600' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {tab.id === 'product' && pendingFundingOffer && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
              )}
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-cyan rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pr-2">
        {unreadNotifs > 0 && (
          <div className="chip bg-accent-rose/20 text-accent-rose text-[10px]">
            {unreadNotifs} new
          </div>
        )}
      </div>
    </nav>
  );
}
