import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import Office from './Office';
import { useGameStore } from '../store/useGameStore';

export default function OfficeTab() {
  const officeTier = useGameStore((s) => s.officeTier);
  const staff = useGameStore((s) => s.staff);
  const founder = useGameStore((s) => s.founder);
  const products = useGameStore((s) => s.products);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  const officeColors: Record<string, { wall: string; floor: string; label: string; desc: string }> = {
    garage: { wall: '#3a3530', floor: '#2a2520', label: 'Garage', desc: 'Where it all begins. Tight quarters, big dreams.' },
    loft: { wall: '#2a3040', floor: '#1f2330', label: 'Open-Plan Loft', desc: 'More room, better vibes, more desks.' },
    floor: { wall: '#1f2c40', floor: '#1a2235', label: 'Full Floor', desc: 'A real office floor. The team is growing up.' },
    tower: { wall: '#1a1f3a', floor: '#141829', label: 'Tower HQ', desc: 'Top of the city. IPO energy.' },
  };
  const colors = officeColors[officeTier];
  const headcount = staff.length + (founder.hasSteppedBack ? 0 : 1);
  const nextTierHeadcount = officeTier === 'garage' ? 6 : officeTier === 'loft' ? 18 : officeTier === 'floor' ? 40 : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <Canvas dpr={[1, 1.5]} shadows>
          <PerspectiveCamera makeDefault position={[12, 10, 12]} fov={35} />
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 15, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#a78bfa" />

          <Office />

          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={40} blur={2} far={10} />
          <Environment preset="city" />

          <OrbitControls
            enablePan={false}
            minDistance={8}
            maxDistance={25}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.5}
            target={[0, 1, 0]}
          />
        </Canvas>

        {/* Overlay info */}
        <div className="absolute top-3 left-3 panel p-3 max-w-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500">Office Tier</div>
          <div className="text-lg font-bold capitalize">{colors.label}</div>
          <div className="text-[11px] text-slate-400 mt-1">{colors.desc}</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Headcount: <span className="text-accent-cyan font-semibold">{headcount}</span>
            {nextTierHeadcount && (
              <span> · next tier at {nextTierHeadcount}</span>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 left-3 panel p-3 max-w-xs text-[11px] text-slate-400">
          <div className="font-semibold text-slate-200 mb-1">🎮 Controls</div>
          <div>• Drag to rotate · Scroll to zoom</div>
          <div>• Each desk = one employee</div>
          <div>• Empty desks show open headcount</div>
        </div>
      </div>

      <div className="panel p-3 border-t border-white/5 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          {products.length} product{products.length !== 1 ? 's' : ''} · {staff.length} staff ·{' '}
          {headcount > 0 ? `Every desk is a real team member.` : 'Hire your first employee from the Staff tab.'}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={() => setActiveTab('staff')}>→ Hire Staff</button>
          <button className="btn-primary text-xs" onClick={() => setActiveTab('build')}>→ Build Product</button>
        </div>
      </div>
    </div>
  );
}
