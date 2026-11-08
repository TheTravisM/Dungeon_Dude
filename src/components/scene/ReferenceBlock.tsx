/**
 * Temporary shadow probe. Until the dungeon and hero exist there is nothing to
 * cast a shadow, so this block proves the key light and shadow map are working.
 * It will be removed once real dungeon geometry lands in Step 4.
 */
export default function ReferenceBlock() {
  return (
    <mesh position={[2.5, 0.75, -2]} castShadow receiveShadow>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#806247" roughness={0.85} metalness={0.05} />
    </mesh>
  );
}
