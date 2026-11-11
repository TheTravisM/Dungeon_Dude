interface PoiMarkerProps {
  kind: 'key' | 'stairs';
  position: [number, number, number];
}

/** Small, readable marker for the level's key or its stairs. */
export default function PoiMarker({ kind, position: pos }: PoiMarkerProps) {
  if (kind === 'stairs') {
    return (
      <group position={pos}>
        {[0, 1, 2].map((step) => (
          <mesh
            key={step}
            position={[0, 0.06 + step * 0.08, step * 0.12]}
            castShadow={false}
            receiveShadow
          >
            <boxGeometry args={[0.7 - step * 0.08, 0.08, 0.32]} />
            <meshStandardMaterial color="#4a4d5a" roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[0, 0.012, 0.36]}>
          <boxGeometry args={[0.55, 0.02, 0.12]} />
          <meshBasicMaterial color="#6fa8ff" toneMapped={false} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[pos[0], pos[1] + 0.35, pos[2]]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={false}>
        <torusGeometry args={[0.1, 0.025, 8, 16]} />
        <meshStandardMaterial
          color="#d9b04a"
          emissive="#a67a20"
          emissiveIntensity={0.8}
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>
      <mesh position={[0, -0.12, 0]} castShadow={false}>
        <boxGeometry args={[0.05, 0.16, 0.05]} />
        <meshStandardMaterial
          color="#d9b04a"
          emissive="#a67a20"
          emissiveIntensity={0.8}
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>
      <mesh position={[0.06, -0.16, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={false}>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#d9b04a" roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}
