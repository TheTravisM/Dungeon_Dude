import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import type { DecalKind, DecalPlacement } from '../../../game/dungeon/decor';
import { FLOOR_TOP } from '../../../game/dungeon/constants';
import { createDecalTexture } from './decalTextures';

interface DecalBatchProps {
  kind: DecalKind;
  items: DecalPlacement[];
}

/** One instanced, transparent plane per decal family. */
export default function DecalBatch({ kind, items }: DecalBatchProps) {
  const texture = useMemo(() => createDecalTexture(kind), [kind]);
  const filtered = useMemo(
    () => items.filter((decal) => decal.kind === kind),
    [items, kind]
  );

  if (!texture || filtered.length === 0) return null;

  return (
    <Instances limit={filtered.length} range={filtered.length} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={texture}
        transparent
        depthWrite={false}
        roughness={kind === 'puddle' ? 0.16 : 0.92}
        metalness={kind === 'puddle' ? 0.45 : 0.02}
        polygonOffset
        polygonOffsetFactor={-2}
        side={THREE.DoubleSide}
      />
      {filtered.map((decal, index) => (
        <Instance
          key={`${kind}-${index}`}
          // Floor plates jitter up by ±0.05, so the decal sits just above the
          // highest possible tile top instead of disappearing into a tile.
          position={[decal.x, FLOOR_TOP + 0.062, decal.z]}
          rotation={[-Math.PI / 2, 0, decal.rotation]}
          scale={[decal.scale, decal.scale, 1]}
        />
      ))}
    </Instances>
  );
}
