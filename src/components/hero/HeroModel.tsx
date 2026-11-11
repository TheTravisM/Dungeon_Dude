import type { HeroRig } from '../../hooks/hero/useHeroRig';
import HeroTorch from './HeroTorch';

interface HeroModelProps {
  rig: HeroRig;
}

/**
 * Hooded adventurer built from grouped primitive boxes.
 *
 * Feet sit at local `y = 0` and the model faces local `+Z`. The hierarchy is
 * intentionally named and separated so 05-06 can animate the hips, legs, and
 * arms without touching the rig root. Purely declarative: no hooks, state, or
 * frame loop.
 */
export default function HeroModel({ rig }: HeroModelProps) {
  return (
    <group ref={rig.root}>
      <group ref={rig.hips} position={[0, 0.5, 0]}>
        {/* Torso and a warm belt accent. */}
        <group ref={rig.torso} position={[0, 0.22, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.4, 0.22]} />
            <meshStandardMaterial
              color="#566070"
              roughness={0.85}
              metalness={0.3}
            />
          </mesh>
          <mesh position={[0, -0.23, 0]} castShadow>
            <boxGeometry args={[0.36, 0.06, 0.24]} />
            <meshStandardMaterial color="#8a5a2b" roughness={0.9} />
          </mesh>
        </group>

        {/* Cloak hangs behind the torso (local -Z is the back). */}
        <group ref={rig.cloak} position={[0, 0.08, -0.15]}>
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.52, 0.07]} />
            <meshStandardMaterial color="#2b2f3a" roughness={0.95} />
          </mesh>
        </group>

        {/* Hood with the face protruding through its open front (+Z). */}
        <group ref={rig.head} position={[0, 0.56, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.26, 0.26, 0.28]} />
            <meshStandardMaterial color="#23262f" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0, 0.055]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color="#c9a27a" roughness={0.85} />
          </mesh>
        </group>

        {/* Legs pivot at the hips and reach down to the floor. */}
        <group ref={rig.legLeft} position={[-0.09, 0, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <boxGeometry args={[0.12, 0.5, 0.14]} />
            <meshStandardMaterial color="#3c4654" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.45, 0.02]} castShadow>
            <boxGeometry args={[0.13, 0.1, 0.18]} />
            <meshStandardMaterial color="#1f2229" roughness={0.95} />
          </mesh>
        </group>
        <group ref={rig.legRight} position={[0.09, 0, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <boxGeometry args={[0.12, 0.5, 0.14]} />
            <meshStandardMaterial color="#3c4654" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.45, 0.02]} castShadow>
            <boxGeometry args={[0.13, 0.1, 0.18]} />
            <meshStandardMaterial color="#1f2229" roughness={0.95} />
          </mesh>
        </group>

        {/* Sword arm: the blade points forward along local +Z. */}
        <group ref={rig.armSword} position={[0.23, 0.36, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <boxGeometry args={[0.11, 0.34, 0.12]} />
            <meshStandardMaterial color="#4a5363" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.32, 0.3]} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.55]} />
            <meshStandardMaterial
              color="#c7d2de"
              roughness={0.35}
              metalness={0.6}
            />
          </mesh>
          <mesh position={[0, -0.32, 0.04]} castShadow>
            <boxGeometry args={[0.2, 0.04, 0.05]} />
            <meshStandardMaterial
              color="#8a6a3b"
              roughness={0.5}
              metalness={0.45}
            />
          </mesh>
        </group>

        {/* Torch arm: the forearm points up, hand above the head. */}
        <group ref={rig.armTorch} position={[-0.23, 0.36, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.11, 0.34, 0.12]} />
            <meshStandardMaterial color="#4a5363" roughness={0.9} />
          </mesh>
          <group ref={rig.torchHand} position={[0, 0.44, 0]}>
            <mesh position={[0, 0.08, 0]} castShadow>
              <boxGeometry args={[0.06, 0.3, 0.06]} />
              <meshStandardMaterial color="#4a2f1c" roughness={0.95} />
            </mesh>
            <HeroTorch />
          </group>
        </group>
      </group>
    </group>
  );
}
