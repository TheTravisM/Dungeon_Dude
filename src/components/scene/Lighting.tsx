/**
 * Cool ambient fill keeps shadowed stone readable, while the warm key light
 * suggests torchlight from above. The torch spotlight is now the only
 * shadow-casting light; the key light is fill only.
 *
 * Final values after the 05-03 balance pass: ambient 1.1 * 0.6 = 0.66,
 * key 3.4 * 0.6 = 2.04.
 */
export default function Lighting() {
  return (
    <>
      <ambientLight color="#9db4d6" intensity={0.66} />
      <directionalLight
        color="#ffb877"
        intensity={2.04}
        position={[12, 18, 8]}
      />
    </>
  );
}
