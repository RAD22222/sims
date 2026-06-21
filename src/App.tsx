import { useEffect, useRef } from 'react';
import { useGameStore } from './store/useGameStore';
import Hud from './ui/Hud/Hud';
import TabsNav from './ui/Hud/TabsNav';
import BuildTab from './ui/Tabs/BuildTab/BuildTab';
import ProductTab from './ui/Tabs/ProductTab/ProductTab';
import StaffTab from './ui/Tabs/StaffTab/StaffTab';
import OfficeTab from './scene/OfficeTab';
import NotificationsTray from './ui/Notifications/NotificationsTray';
import OnboardingModal from './ui/Onboarding/OnboardingModal';
import NewProductModal from './ui/Modals/NewProductModal';
import FundingModal from './ui/Modals/FundingModal';
import GameOverScreen from './ui/Hud/GameOverScreen';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const day = useGameStore((s) => s.day);
  const isPaused = useGameStore((s) => s.isPaused);
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const tick = useGameStore((s) => s.tick);
  const activeTab = useGameStore((s) => s.activeTab);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const founder = useGameStore((s) => s.founder);
  const products = useGameStore((s) => s.products);
  const candidatePool = useGameStore((s) => s.candidatePool);
  const refreshCandidatePool = useGameStore((s) => s.refreshCandidatePool);

  // Tick loop
  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isPaused || gameOverReason !== null) return;
    const ms = gameSpeed === 1 ? 1500 : gameSpeed === 2 ? 750 : 300;
    intervalRef.current = window.setInterval(() => {
      tick();
    }, ms);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isPaused, gameSpeed, tick, gameOverReason]);

  // Initial candidate pool when founder exists
  useEffect(() => {
    if (founder.name && candidatePool.length === 0) {
      refreshCandidatePool();
    }
  }, [founder.name, candidatePool.length, refreshCandidatePool]);

  const hasFounder = founder.name !== '';
  const hasProducts = products.length > 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-900 text-slate-100">
      {!hasFounder ? (
        <OnboardingModal />
      ) : (
        <>
          <Hud />
          <TabsNav />
          <main className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === 'build' && hasProducts && <BuildTab />}
                {activeTab === 'product' && hasProducts && <ProductTab />}
                {activeTab === 'staff' && <StaffTab />}
                {activeTab === 'office' && <OfficeTab />}
                {activeTab === 'build' && !hasProducts && (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    No products yet — start one from the New Product button.
                  </div>
                )}
                {activeTab === 'product' && !hasProducts && (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    No products yet — start one from the New Product button.
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <NotificationsTray />
          <NewProductModal />
          <FundingModal />
          {gameOverReason && <GameOverScreen />}
        </>
      )}
    </div>
  );
}
