import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface Occupant {
  name: string;
  role: string;
  morale: number;
  productId: string | 'shared';
  isFounder?: boolean;
}

export default function DeskStation({
  position,
  occupied,
  occupant,
}: {
  position: [number, number, number];
  occupied: boolean;
  occupant?: Occupant;
}) {
  const screenRef = useRef<THREE.Mesh>(null);
  const morale = occupant?.morale ?? 0;
  const monitorOn = occupied && morale > 20;

  // Subtle screen flicker for active desks
  useFrame((state) => {
    if (!screenRef.current || !monitorOn) return;
    const mat = screenRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 3 + position[0]) * 0.3;
  });

  const founderColor = '#a78bfa';
  const deskColor = occupied ? '#2a3142' : '#1a1f2e';
  const accent = occupant?.isFounder
    ? founderColor
    : morale < 30
    ? '#fb7185'
    : morale < 60
    ? '#fbbf24'
    : '#22d3ee';

  return (
    <group position={position}>
      {/* Desk top */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.08, 0.9]} />
        <meshStandardMaterial color={deskColor} roughness={0.6} />
      </mesh>
      {/* Desk legs */}
      {[
        [-0.7, -0.7],
        [0.7, -0.7],
        [-0.7, 0.35],
        [0.7, 0.35],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.375, z]}>
          <boxGeometry args={[0.08, 0.75, 0.08]} />
          <meshStandardMaterial color="#1a1f2e" />
        </mesh>
      ))}

      {/* Monitor stand */}
      <mesh position={[0, 0.95, -0.25]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#1a1f2e" />
      </mesh>
      {/* Monitor */}
      <mesh position={[0, 1.25, -0.25]} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.05]} />
        <meshStandardMaterial color="#0a0e1a" />
      </mesh>
      {/* Screen (lit when occupied) */}
      <mesh ref={screenRef} position={[0, 1.25, -0.22]}>
        <planeGeometry args={[0.8, 0.4]} />
        <meshStandardMaterial
          color={monitorOn ? accent : '#0a0e1a'}
          emissive={monitorOn ? accent : '#000000'}
          emissiveIntensity={monitorOn ? 1.5 : 0}
        />
      </mesh>

      {/* Chair (only if occupied) */}
      {occupied && (
        <group position={[0, 0, 0.45]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial color="#1a1f2e" />
          </mesh>
          <mesh position={[0, 0.85, -0.22]} castShadow>
            <boxGeometry args={[0.5, 0.6, 0.08]} />
            <meshStandardMaterial color="#1a1f2e" />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
            <meshStandardMaterial color="#0a0e1a" />
          </mesh>
        </group>
      )}

      {/* Avatar: simple head + body cube above chair */}
      {occupied && (
        <group position={[0, 1.0, 0.45]}>
          {/* Body */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <capsuleGeometry args={[0.18, 0.2, 4, 8]} />
            <meshStandardMaterial color={occupant?.isFounder ? '#a78bfa' : '#3a4156'} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color={occupant?.isFounder ? '#c4b5fd' : '#94a3b8'} />
          </mesh>
        </group>
      )}

      {/* Hover label */}
      {occupied && occupant && (
        <Html position={[0, 1.9, 0]} center distanceFactor={10} occlude={false}>
          <div className="px-2 py-0.5 rounded bg-bg-900/90 border border-white/10 text-[10px] text-white whitespace-nowrap pointer-events-none">
            <div className="font-semibold">{occupant.name}</div>
            <div className="text-[9px] text-slate-400">{occupant.role} · morale {Math.round(morale)}%</div>
          </div>
        </Html>
      )}

      {/* Empty desk indicator */}
      {!occupied && (
        <mesh position={[0, 1.25, -0.22]}>
          <planeGeometry args={[0.7, 0.3]} />
          <meshBasicMaterial color="#0a0e1a" />
        </mesh>
      )}
    </group>
  );
}
