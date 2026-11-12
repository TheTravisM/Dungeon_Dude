import { RoundedBox } from '@react-three/drei';
import type { HeroRig } from '../../hooks/hero/useHeroRig';
import HeroTorch from './HeroTorch';

interface HeroModelProps {
  rig: HeroRig;
}

/**
 * Stylized dungeon adventurer built from layered low-poly armor and cloth.
 * Feet stay at local y = 0, the model faces +Z, and rig refs remain on the
 * same joints used by movement and combat animation.
 */
export default function HeroModel({ rig }: HeroModelProps) {
  return (
    <group ref={rig.root}>
      <group ref={rig.hips} position={[0, 0.5, 0]}>
        <group ref={rig.torso} position={[0, 0.22, 0]}>
          <RoundedBox
            args={[0.36, 0.42, 0.25]}
            radius={0.055}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial
              color="#46566a"
              roughness={0.72}
              metalness={0.28}
            />
          </RoundedBox>

          <RoundedBox
            position={[0, 0.025, 0.135]}
            args={[0.25, 0.27, 0.035]}
            radius={0.035}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial
              color="#65778a"
              roughness={0.58}
              metalness={0.38}
            />
          </RoundedBox>

          <RoundedBox
            position={[0, 0.075, 0.158]}
            args={[0.055, 0.19, 0.012]}
            radius={0.008}
            smoothness={1}
          >
            <meshStandardMaterial
              color="#a8bac8"
              roughness={0.48}
              metalness={0.55}
            />
          </RoundedBox>

          <mesh position={[0, -0.07, 0.16]} castShadow>
            <octahedronGeometry args={[0.055, 0]} />
            <meshStandardMaterial
              color="#d79a45"
              roughness={0.4}
              metalness={0.65}
              emissive="#66340d"
              emissiveIntensity={0.35}
            />
          </mesh>

          <RoundedBox
            position={[-0.045, 0.015, 0.163]}
            rotation={[0, 0, -0.48]}
            args={[0.045, 0.38, 0.018]}
            radius={0.012}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#563927" roughness={0.9} />
          </RoundedBox>

          <RoundedBox
            position={[0.045, 0.015, 0.17]}
            rotation={[0, 0, 0.48]}
            args={[0.045, 0.38, 0.018]}
            radius={0.012}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#563927" roughness={0.9} />
          </RoundedBox>

          <RoundedBox
            position={[0, 0.205, 0]}
            args={[0.39, 0.105, 0.29]}
            radius={0.035}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#303a49" roughness={0.85} />
          </RoundedBox>

          <mesh position={[-0.225, 0.2, 0.015]} castShadow>
            <icosahedronGeometry args={[0.145, 0]} />
            <meshStandardMaterial
              color="#61758a"
              roughness={0.6}
              metalness={0.32}
            />
          </mesh>
          <mesh position={[0.225, 0.2, 0.015]} castShadow>
            <icosahedronGeometry args={[0.145, 0]} />
            <meshStandardMaterial
              color="#61758a"
              roughness={0.6}
              metalness={0.32}
            />
          </mesh>

          <RoundedBox
            position={[0, -0.235, 0]}
            args={[0.39, 0.085, 0.28]}
            radius={0.018}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#68452f" roughness={0.88} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.235, 0.15]}
            args={[0.105, 0.09, 0.025]}
            radius={0.012}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial
              color="#d2a457"
              roughness={0.38}
              metalness={0.7}
            />
          </RoundedBox>

          <RoundedBox
            position={[-0.235, -0.22, 0.015]}
            args={[0.12, 0.15, 0.15]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#5b3b29" roughness={0.92} />
          </RoundedBox>
          <RoundedBox
            position={[0.235, -0.22, 0.015]}
            args={[0.12, 0.15, 0.15]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#5b3b29" roughness={0.92} />
          </RoundedBox>
        </group>

        <group ref={rig.cloak} position={[0, 0.07, -0.16]}>
          <mesh position={[0, -0.17, -0.025]} castShadow>
            <cylinderGeometry args={[0.13, 0.3, 0.62, 6, 1]} />
            <meshStandardMaterial
              color="#3b4a60"
              roughness={0.88}
              side={2}
            />
          </mesh>
          <RoundedBox
            position={[0, -0.465, -0.025]}
            args={[0.43, 0.055, 0.07]}
            radius={0.012}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#b17b3d" roughness={0.72} />
          </RoundedBox>
          <mesh position={[0, -0.15, -0.19]} castShadow>
            <icosahedronGeometry args={[0.105, 0]} />
            <meshStandardMaterial
              color="#d2a457"
              roughness={0.4}
              metalness={0.72}
            />
          </mesh>
          <mesh position={[0, -0.15, -0.265]} castShadow>
            <octahedronGeometry args={[0.055, 0]} />
            <meshStandardMaterial
              color="#df8b38"
              roughness={0.3}
              metalness={0.35}
              emissive="#a74b13"
              emissiveIntensity={0.65}
            />
          </mesh>
          <RoundedBox
            position={[0, -0.29, -0.205]}
            args={[0.018, 0.23, 0.018]}
            radius={0.005}
            smoothness={1}
          >
            <meshStandardMaterial color="#c4934b" roughness={0.5} metalness={0.6} />
          </RoundedBox>
          <mesh position={[0, -0.43, 0.02]} castShadow>
            <coneGeometry args={[0.045, 0.13, 5]} />
            <meshStandardMaterial
              color="#647b91"
              roughness={0.8}
              metalness={0.15}
            />
          </mesh>
        </group>

        <group ref={rig.head} position={[0, 0.56, 0]}>
          <RoundedBox
            position={[0, 0.015, -0.015]}
            args={[0.34, 0.34, 0.32]}
            radius={0.09}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#252e3d" roughness={0.96} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.065, 0.115]}
            args={[0.23, 0.17, 0.105]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#b98c67" roughness={0.82} />
          </RoundedBox>
          <RoundedBox
            position={[0, 0.005, 0.175]}
            args={[0.235, 0.105, 0.035]}
            radius={0.012}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#10151e" roughness={0.75} />
          </RoundedBox>
          <RoundedBox
            position={[-0.055, 0.005, 0.197]}
            args={[0.043, 0.018, 0.01]}
            radius={0.006}
            smoothness={1}
          >
            <meshStandardMaterial
              color="#f0bd68"
              emissive="#c87520"
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </RoundedBox>
          <RoundedBox
            position={[0.055, 0.005, 0.197]}
            args={[0.043, 0.018, 0.01]}
            radius={0.006}
            smoothness={1}
          >
            <meshStandardMaterial
              color="#f0bd68"
              emissive="#c87520"
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.095, 0.17]}
            args={[0.24, 0.055, 0.06]}
            radius={0.012}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#252e3d" roughness={0.96} />
          </RoundedBox>
        </group>

        <group ref={rig.legLeft} position={[-0.105, 0, 0]}>
          <RoundedBox
            position={[0, -0.17, 0]}
            args={[0.145, 0.3, 0.17]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#354254" roughness={0.9} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.335, 0.015]}
            args={[0.135, 0.19, 0.17]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial
              color="#56697c"
              roughness={0.62}
              metalness={0.28}
            />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.42, 0.045]}
            args={[0.15, 0.11, 0.23]}
            radius={0.03}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#252a32" roughness={0.92} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.32, 0.105]}
            args={[0.1, 0.025, 0.025]}
            radius={0.008}
            smoothness={1}
          >
            <meshStandardMaterial color="#c4934b" roughness={0.48} metalness={0.5} />
          </RoundedBox>
        </group>
        <group ref={rig.legRight} position={[0.105, 0, 0]}>
          <RoundedBox
            position={[0, -0.17, 0]}
            args={[0.145, 0.3, 0.17]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#354254" roughness={0.9} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.335, 0.015]}
            args={[0.135, 0.19, 0.17]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial
              color="#56697c"
              roughness={0.62}
              metalness={0.28}
            />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.42, 0.045]}
            args={[0.15, 0.11, 0.23]}
            radius={0.03}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#252a32" roughness={0.92} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.32, 0.105]}
            args={[0.1, 0.025, 0.025]}
            radius={0.008}
            smoothness={1}
          >
            <meshStandardMaterial color="#c4934b" roughness={0.48} metalness={0.5} />
          </RoundedBox>
        </group>

        <group ref={rig.armSword} position={[0.23, 0.36, 0]}>
          <RoundedBox
            position={[0, -0.13, 0]}
            args={[0.15, 0.24, 0.16]}
            radius={0.03}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#526579" roughness={0.76} metalness={0.2} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.28, 0.025]}
            args={[0.105, 0.16, 0.13]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#714b32" roughness={0.9} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.32, 0.12]}
            args={[0.055, 0.05, 0.17]}
            radius={0.012}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#5d3d29" roughness={0.82} />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.32, 0.18]}
            args={[0.24, 0.045, 0.055]}
            radius={0.015}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#c4934b" roughness={0.42} metalness={0.62} />
          </RoundedBox>
          <mesh position={[0, -0.32, 0.48]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.075, 0.48, 4]} />
            <meshStandardMaterial color="#b9c9d6" roughness={0.28} metalness={0.82} />
          </mesh>
          <RoundedBox
            position={[0, -0.32, 0.4]}
            args={[0.018, 0.012, 0.33]}
            radius={0.004}
            smoothness={1}
          >
            <meshStandardMaterial color="#eef4f7" roughness={0.22} metalness={0.88} />
          </RoundedBox>
          <mesh position={[0, -0.32, 0.13]} castShadow>
            <icosahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial color="#d4a654" roughness={0.38} metalness={0.68} />
          </mesh>
        </group>

        <group ref={rig.armTorch} position={[-0.23, 0.36, 0]}>
          <RoundedBox
            position={[0, 0.16, 0]}
            args={[0.15, 0.25, 0.16]}
            radius={0.03}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#526579" roughness={0.76} metalness={0.2} />
          </RoundedBox>
          <RoundedBox
            position={[0, 0.34, 0.02]}
            args={[0.11, 0.15, 0.13]}
            radius={0.025}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#714b32" roughness={0.9} />
          </RoundedBox>
          <group ref={rig.torchHand} position={[0, 0.44, 0]}>
            <RoundedBox
              position={[0, 0.08, 0]}
              args={[0.065, 0.3, 0.065]}
              radius={0.012}
              smoothness={1}
              castShadow
            >
              <meshStandardMaterial color="#5d3d29" roughness={0.88} />
            </RoundedBox>
            <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.065, 0.018, 5, 8]} />
              <meshStandardMaterial color="#b7833e" roughness={0.45} metalness={0.58} />
            </mesh>
            <HeroTorch />
          </group>
        </group>
      </group>
    </group>
  );
}
