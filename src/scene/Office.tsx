import { useGameStore } from '../store/useGameStore';
import DeskStation from './DeskStation';
import * as THREE from 'three';
import { useMemo } from 'react';

const TIER_LAYOUT: Record<string, { desksWide: number; desksDeep: number; spacing: number; floorSize: [number, number]; wallHeight: number; wallColor: string; floorColor: string }> = {
  garage: { desksWide: 2, desksDeep: 2, spacing: 3, floorSize: [10, 10], wallHeight: 3, wallColor: '#3a3530', floorColor: '#2a2520' },
  loft: { desksWide: 4, desksDeep: 3, spacing: 3, floorSize: [16, 14], wallHeight: 3.5, wallColor: '#2a3040', floorColor: '#1f2330' },
  floor: { desksWide: 6, desksDeep: 4, spacing: 3, floorSize: [22, 18], wallHeight: 4, wallColor: '#1f2c40', floorColor: '#1a2235' },
  tower: { desksWide: 8, desksDeep: 6, spacing: 3, floorSize: [30, 24], wallHeight: 5, wallColor: '#1a1f3a', floorColor: '#141829' },
};

export default function Office() {
  const officeTier = useGameStore((s) => s.officeTier);
  const staff = useGameStore((s) => s.staff);
  const founder = useGameStore((s) => s.founder);
  const products = useGameStore((s) => s.products);

  const layout = TIER_LAYOUT[officeTier];
  const maxDesks = layout.desksWide * layout.desksDeep;

  // Build a list of desk occupants: founder first, then staff
  const occupants = useMemo(() => {
    const list: { name: string; role: string; morale: number; productId: string | 'shared'; isFounder?: boolean }[] = [];
    if (!founder.hasSteppedBack) {
      list.push({
        name: founder.name,
        role: founder.specialization,
        morale: 80,
        productId: products[0]?.id ?? 'shared',
        isFounder: true,
      });
    }
    for (const e of staff) {
      if (list.length >= maxDesks) break;
      list.push({
        name: e.name,
        role: e.role,
        morale: e.morale,
        productId: e.assignedProductId,
      });
    }
    return list;
  }, [staff, founder, products, maxDesks]);

  // Position desks in a grid centered on origin
  const deskPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const sx = (layout.desksWide - 1) * layout.spacing;
    const sz = (layout.desksDeep - 1) * layout.spacing;
    for (let z = 0; z < layout.desksDeep; z++) {
      for (let x = 0; x < layout.desksWide; x++) {
        positions.push([
          x * layout.spacing - sx / 2,
          0,
          z * layout.spacing - sz / 2,
        ]);
      }
    }
    return positions;
  }, [layout]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={layout.floorSize} />
        <meshStandardMaterial color={layout.floorColor} roughness={0.8} />
      </mesh>

      {/* Back walls (L-shape) */}
      <mesh position={[0, layout.wallHeight / 2, -layout.floorSize[1] / 2]} castShadow receiveShadow>
        <boxGeometry args={[layout.floorSize[0], layout.wallHeight, 0.2]} />
        <meshStandardMaterial color={layout.wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[-layout.floorSize[0] / 2, layout.wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, layout.wallHeight, layout.floorSize[1]]} />
        <meshStandardMaterial color={layout.wallColor} roughness={0.9} />
      </mesh>

      {/* Decorative accent strips (neon glow lines on the floor edges) */}
      <mesh position={[0, 0.01, -layout.floorSize[1] / 2 + 0.1]}>
        <boxGeometry args={[layout.floorSize[0], 0.02, 0.05]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-layout.floorSize[0] / 2 + 0.1, 0.01, 0]}>
        <boxGeometry args={[0.05, 0.02, layout.floorSize[1]]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={1.5} />
      </mesh>

      {/* Central decorative element: a small "server rack" or plant */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#1a1f2e" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Glowing screen on the central server */}
        <mesh position={[0, 0.7, 0.51]}>
          <planeGeometry args={[0.7, 0.4]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Desk stations */}
      {deskPositions.map((pos, i) => {
        const occupant = occupants[i];
        return (
          <DeskStation
            key={i}
            position={pos}
            occupied={!!occupant}
            occupant={occupant}
          />
        );
      })}
    </group>
  );
}
