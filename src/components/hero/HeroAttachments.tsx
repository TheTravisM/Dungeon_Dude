import { RoundedBox } from '@react-three/drei';

const RED_CLOTH = '#8a2026';
const RED_CLOTH_DARK = '#5f1419';
const LEATHER = '#4a3324';
const PLATE = '#68788c';
const PLATE_DARK = '#3b4655';
const BRASS = '#b88a45';

/**
 * Add-on pieces for the procedural knight. They are grouped by the body part
 * they belong to so a future Mixamo migration can swap each group onto its
 * matching bone without rewriting the rest of the character.
 *
 * The blueprint prefers a Mixamo base plus library attachments. Those files are
 * not present in assets-src, so these meshes carry the same brief: a red hooded
 * cowl, a large shield on the back, and a heavy left pauldron.
 */

/** Red hood that covers the head and face, with a dark recess and dim eyes. */
export function RedHood() {
  return (
    <group>
      <mesh position={[0, 0.03, -0.02]} scale={[0.225, 0.245, 0.225]}>
        <sphereGeometry args={[1, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.82]} />
        <meshStandardMaterial color={RED_CLOTH} roughness={0.94} />
      </mesh>

      {/* Cloth falling over the shoulders and down the back of the neck. */}
      <mesh position={[0, -0.14, -0.09]} rotation={[0.18, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.24, 0.26, 8, 1, true]} />
        <meshStandardMaterial
          color={RED_CLOTH_DARK}
          roughness={0.96}
          side={2}
        />
      </mesh>

      {/* Face recess: the cowl leaves only shadow and two faint eyes visible. */}
      <RoundedBox
        position={[0, -0.03, 0.145]}
        args={[0.17, 0.19, 0.075]}
        radius={0.035}
        smoothness={1}
      >
        <meshStandardMaterial color="#120d10" roughness={0.98} />
      </RoundedBox>
      <mesh position={[-0.048, 0.005, 0.188]}>
        <boxGeometry args={[0.036, 0.014, 0.01]} />
        <meshStandardMaterial
          color="#e8b46a"
          emissive="#b56a1d"
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.048, 0.005, 0.188]}>
        <boxGeometry args={[0.036, 0.014, 0.01]} />
        <meshStandardMaterial
          color="#e8b46a"
          emissive="#b56a1d"
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>

      {/* Hood rim catches the cool key light and separates it from the face. */}
      <mesh position={[0, -0.02, 0.13]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.155, 0.022, 6, 14, Math.PI]} />
        <meshStandardMaterial color={RED_CLOTH} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Large round shield strapped across the back, metal boss and worn wood face. */
export function BackShield() {
  return (
    <group position={[0, 0.04, -0.31]} rotation={[Math.PI / 2, 0, 0.12]}>
      <mesh>
        <cylinderGeometry args={[0.33, 0.33, 0.045, 20]} />
        <meshStandardMaterial color={LEATHER} roughness={0.82} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.026, 0]}>
        <torusGeometry args={[0.31, 0.028, 8, 20]} />
        <meshStandardMaterial
          color={PLATE}
          roughness={0.44}
          metalness={0.72}
        />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshStandardMaterial
          color={BRASS}
          roughness={0.36}
          metalness={0.7}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.035, 0.022, 0.5]} />
        <meshStandardMaterial color={PLATE_DARK} roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

/** Heavy layered plate on the left shoulder. */
export function LeftPauldron() {
  return (
    <group position={[-0.225, 0.2, 0.01]}>
      <mesh scale={[0.19, 0.16, 0.19]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={PLATE} roughness={0.5} metalness={0.55} />
      </mesh>
      <RoundedBox
        position={[-0.02, -0.06, 0.02]}
        rotation={[0, 0, 0.25]}
        args={[0.24, 0.11, 0.27]}
        radius={0.035}
        smoothness={1}
      >
        <meshStandardMaterial color={PLATE_DARK} roughness={0.46} metalness={0.6} />
      </RoundedBox>
      <RoundedBox
        position={[-0.03, -0.13, 0.03]}
        rotation={[0, 0, 0.32]}
        args={[0.2, 0.09, 0.23]}
        radius={0.03}
        smoothness={1}
      >
        <meshStandardMaterial color={PLATE} roughness={0.42} metalness={0.65} />
      </RoundedBox>
      <mesh position={[-0.02, 0.04, 0.1]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color={BRASS} roughness={0.35} metalness={0.75} />
      </mesh>
    </group>
  );
}
