/**
 * Cool scene lighting so the slate, blue, and purple stone reads as stone
 * instead of warm brick. The directional key is a cold overhead fill that keeps
 * wall relief readable; the ambient term lifts the deepest dark areas just enough
 * to keep the board legible. The torch is the only warm light, and it is
 * deliberately restrained so it accents the scene instead of tinting it.
 */
export default function Lighting() {
  return (
    <>
      <ambientLight color="#7680a8" intensity={0.38} />
      <directionalLight
        color="#aab6d4"
        intensity={1.15}
        position={[12, 18, 8]}
      />
    </>
  );
}
