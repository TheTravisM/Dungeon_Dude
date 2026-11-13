import { useMemo } from 'react';
import { PlaneGeometry } from 'three';
import { getBlobTexture } from './blobTexture';

/** Flat unit plane; the shared geometry never needs disposal. */
const PLANE = new PlaneGeometry(1, 1);

interface BlobShadowProps {
  /** Footprint diameter in world units. */
  size?: number;
  opacity?: number;
  position?: [number, number, number];
}

/**
 * Fake contact shadow. There are no shadow maps in this project, so a soft
 * radial decal grounds the character instead. It is transparent, writes no
 * depth, ignores tone mapping, and never blocks a raycast. Height is supplied
 * by the caller because it must clear the highest floor jitter.
 */
export default function BlobShadow({
  size = 1,
  opacity = 0.6,
  position = [0, 0, 0],
}: BlobShadowProps) {
  const texture = useMemo(getBlobTexture, []);

  return (
    <mesh
      geometry={PLANE}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[size, size, 1]}
      renderOrder={2}
      raycast={() => undefined}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}
