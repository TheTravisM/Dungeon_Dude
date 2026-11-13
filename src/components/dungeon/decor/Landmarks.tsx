import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type {
  AltarPlacement,
  BrazierPlacement,
  ChestPlacement,
  PrisonPlacement,
  SconcePlacement,
} from '../../../game/dungeon/decor';

function FlickerLight({
  position,
  color = '#ff9b4a',
  distance = 5,
  intensity = 2.4,
}: {
  position: [number, number, number];
  color?: string;
  distance?: number;
  intensity?: number;
}) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const light = lightRef.current;
    if (!light) return;
    const t = clock.elapsedTime;
    light.intensity =
      intensity *
      (0.86 + Math.sin(t * 7.3 + position[0]) * 0.08 + Math.sin(t * 13.1) * 0.04);
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={intensity}
      distance={distance}
      decay={2}
    />
  );
}

export function Braziers({ items }: { items: BrazierPlacement[] }) {
  return (
    <>
      {items.map((brazier, index) => (
        <group key={`brazier-${index}`} position={[brazier.x, brazier.y, brazier.z]}>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.22, 0.14, 0.35, 8]} />
            <meshStandardMaterial color="#494b55" roughness={0.8} metalness={0.45} />
          </mesh>
          <mesh position={[0, 0.46, 0]}>
            <coneGeometry args={[0.16, 0.3, 7]} />
            <meshStandardMaterial
              color="#ffb45e"
              emissive="#ff7a1e"
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
          {brazier.lit && (
            <FlickerLight position={[0, 0.75, 0]} intensity={2.8} distance={5.5} />
          )}
        </group>
      ))}
    </>
  );
}

export function Sconces({ items }: { items: SconcePlacement[] }) {
  return (
    <>
      {items.map((sconce, index) => (
        <group
          key={`sconce-${index}`}
          position={[sconce.x, sconce.y, sconce.z]}
          rotation={[0, sconce.rotation, 0]}
        >
          <mesh position={[0, -0.05, -0.04]}>
            <boxGeometry args={[0.16, 0.28, 0.08]} />
            <meshStandardMaterial color="#3b3f49" roughness={0.75} metalness={0.55} />
          </mesh>
          <mesh position={[0, 0.02, 0.16]}>
            <coneGeometry args={[0.075, 0.2, 7]} />
            <meshStandardMaterial
              color="#ffc479"
              emissive="#ff8b28"
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </mesh>
          {sconce.banner && (
            <mesh position={[0, 0.48, -0.08]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.46, 0.95]} />
              <meshStandardMaterial
                color="#7a2834"
                roughness={0.94}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          {sconce.lit && (
            <FlickerLight position={[0, 0.16, 0.18]} intensity={1.8} distance={4.2} />
          )}
        </group>
      ))}
    </>
  );
}

export function Chests({ items }: { items: ChestPlacement[] }) {
  return (
    <>
      {items.map((chest, index) => (
        <group
          key={`chest-${index}`}
          position={[chest.x, chest.y, chest.z]}
          rotation={[0, chest.rotation, 0]}
        >
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.62, 0.36, 0.44]} />
            <meshStandardMaterial color="#5a3a22" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.41, 0]}>
            <boxGeometry args={[0.64, 0.12, 0.46]} />
            <meshStandardMaterial color="#6d4a2a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.39, 0.235]}>
            <boxGeometry args={[0.12, 0.16, 0.03]} />
            <meshStandardMaterial
              color="#d9b04a"
              emissive="#7a5a14"
              emissiveIntensity={0.5}
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function Altars({ items }: { items: AltarPlacement[] }) {
  return (
    <>
      {items.map((altar, index) => (
        <group
          key={`altar-${index}`}
          position={[altar.x, altar.y, altar.z]}
          rotation={[0, altar.rotation, 0]}
        >
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[0.9, 0.48, 0.62]} />
            <meshStandardMaterial color="#505868" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.51, 0]}>
            <boxGeometry args={[0.98, 0.08, 0.7]} />
            <meshStandardMaterial color="#687182" roughness={0.82} />
          </mesh>
          {[-0.25, 0.25].map((offset) => (
            <group key={offset} position={[offset, 0.57, 0]}>
              <mesh>
                <cylinderGeometry args={[0.035, 0.04, 0.18, 6]} />
                <meshStandardMaterial color="#d8cfae" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.14, 0]}>
                <coneGeometry args={[0.035, 0.11, 6]} />
                <meshStandardMaterial
                  color="#ffd08a"
                  emissive="#ff9a32"
                  emissiveIntensity={2}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}
          <FlickerLight position={[0, 0.9, 0]} intensity={2.1} distance={5} />
        </group>
      ))}
    </>
  );
}

export function Prisons({ items }: { items: PrisonPlacement[] }) {
  return (
    <>
      {items.map((prison, index) => {
        const bars = 5;
        return (
          <group
            key={`prison-${index}`}
            position={[prison.x, prison.y, prison.z]}
            rotation={[0, prison.rotation, 0]}
          >
            {Array.from({ length: bars }, (_, bar) => {
              const offset = (bar / (bars - 1) - 0.5) * prison.width;
              return (
                <mesh key={bar} position={[offset, 0.62, 0]}>
                  <boxGeometry args={[0.055, 1.2, 0.055]} />
                  <meshStandardMaterial color="#30343d" metalness={0.7} roughness={0.5} />
                </mesh>
              );
            })}
            <mesh position={[0, 1.2, 0]}>
              <boxGeometry args={[prison.width, 0.07, 0.07]} />
              <meshStandardMaterial color="#30343d" metalness={0.7} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <boxGeometry args={[prison.width, 0.07, 0.07]} />
              <meshStandardMaterial color="#30343d" metalness={0.7} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
