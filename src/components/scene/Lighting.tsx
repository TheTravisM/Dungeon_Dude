/**
 * A cool ambient fill keeps shadowed stone readable, while the warm key light
 * suggests torchlight from above. The directional light owns the shadow map,
 * so every future caster only needs castShadow on its own mesh.
 */
export default function Lighting() {
  return (
    <>
      <ambientLight color="#9db4d6" intensity={1.1} />
      <directionalLight
        color="#ffb877"
        intensity={3.4}
        position={[12, 18, 8]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
    </>
  );
}
