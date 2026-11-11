/**
 * Cool scene lighting so the slate, blue, and purple stone reads as stone
 * instead of warm brick. The directional key is a cold overhead fill that keeps
 * wall relief readable; the ambient term lifts the deepest shadows without
 * flattening the diorama. The torch is the only warm light left, and it is
 * deliberately restrained so it accents the scene instead of tinting it.
 */
export default function Lighting() {
  return (
    <>
      <ambientLight color="#9aa0b8" intensity={0.55} />
      <directionalLight
        color="#c2cbdc"
        intensity={1.65}
        position={[12, 18, 8]}
      />
    </>
  );
}
