import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import type { PropPlacement } from '../../../game/dungeon/decor';

function groupByKind(props: PropPlacement[]) {
  return {
    pillar: props.filter(
      (prop) => prop.kind === 'pillar' || prop.kind === 'brokenPillar'
    ),
    barrel: props.filter((prop) => prop.kind === 'barrel'),
    crate: props.filter((prop) => prop.kind === 'crate'),
    rubble: props.filter((prop) => prop.kind === 'rubble'),
    bones: props.filter((prop) => prop.kind === 'bones'),
    mushroom: props.filter((prop) => prop.kind === 'mushroom'),
    broken: props.filter((prop) => prop.kind === 'brokenPillar'),
  };
}

/** One batched draw call per prop family. */
export default function PropBatches({ props }: { props: PropPlacement[] }) {
  const batches = useMemo(() => groupByKind(props), [props]);
  const solidPillars = batches.pillar.filter((prop) => prop.kind === 'pillar');

  return (
    <>
      <Instances limit={Math.max(1, solidPillars.length)} range={solidPillars.length}>
        <cylinderGeometry args={[0.22, 0.27, 1.7, 8]} />
        <meshStandardMaterial color="#596170" roughness={0.92} metalness={0.03} />
        {solidPillars.map((prop, index) => (
          <Instance
            key={`pillar-${index}`}
            position={[prop.x, prop.y + 0.85 * prop.scale, prop.z]}
            rotation={[0, prop.rotation, 0]}
            scale={prop.scale}
          />
        ))}
      </Instances>

      <Instances limit={Math.max(1, batches.broken.length)} range={batches.broken.length}>
        <cylinderGeometry args={[0.22, 0.27, 1.7, 8]} />
        <meshStandardMaterial color="#4e5665" roughness={0.96} metalness={0.02} />
        {batches.broken.map((prop, index) => (
          <Instance
            key={`broken-${index}`}
            position={[prop.x, prop.y + 0.32 * prop.scale, prop.z]}
            rotation={[0.32, prop.rotation, 0.18]}
            scale={[prop.scale, prop.scale * 0.42, prop.scale]}
          />
        ))}
      </Instances>

      <Instances limit={Math.max(1, batches.barrel.length)} range={batches.barrel.length}>
        <cylinderGeometry args={[0.25, 0.29, 0.56, 10]} />
        <meshStandardMaterial color="#6b4a2f" roughness={0.88} metalness={0.02} />
        {batches.barrel.map((prop, index) => (
          <Instance
            key={`barrel-${index}`}
            position={[prop.x, prop.y + 0.28 * prop.scale, prop.z]}
            rotation={[0, prop.rotation, 0]}
            scale={prop.scale}
          />
        ))}
      </Instances>

      <Instances limit={Math.max(1, batches.crate.length)} range={batches.crate.length}>
        <boxGeometry args={[0.52, 0.5, 0.52]} />
        <meshStandardMaterial color="#5f4630" roughness={0.9} metalness={0.02} />
        {batches.crate.map((prop, index) => (
          <Instance
            key={`crate-${index}`}
            position={[prop.x, prop.y + 0.25 * prop.scale, prop.z]}
            rotation={[0, prop.rotation, 0]}
            scale={prop.scale}
          />
        ))}
      </Instances>

      <Instances limit={Math.max(1, batches.rubble.length)} range={batches.rubble.length}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#4a505d" roughness={0.98} metalness={0.02} />
        {batches.rubble.map((prop, index) => (
          <Instance
            key={`rubble-${index}`}
            position={[prop.x, prop.y + 0.15 * prop.scale, prop.z]}
            rotation={[prop.rotation * 0.4, prop.rotation, prop.rotation * 0.2]}
            scale={[prop.scale, prop.scale * 0.7, prop.scale]}
          />
        ))}
      </Instances>

      <Instances limit={Math.max(1, batches.bones.length)} range={batches.bones.length}>
        <boxGeometry args={[0.32, 0.055, 0.055]} />
        <meshStandardMaterial color="#c8c0ad" roughness={0.82} metalness={0.02} />
        {batches.bones.map((prop, index) => (
          <Instance
            key={`bones-${index}`}
            position={[prop.x, prop.y + 0.04, prop.z]}
            rotation={[0, prop.rotation, (index % 2 === 0 ? 1 : -1) * 0.15]}
            scale={prop.scale}
          />
        ))}
      </Instances>

      <Instances
        limit={Math.max(1, batches.mushroom.length)}
        range={batches.mushroom.length}
      >
        <coneGeometry args={[0.095, 0.13, 7]} />
        <meshStandardMaterial
          color="#5c9d8c"
          emissive="#2d7b6e"
          emissiveIntensity={0.7}
          roughness={0.5}
        />
        {batches.mushroom.map((prop, index) => (
          <Instance
            key={`mushroom-${index}`}
            position={[prop.x, prop.y + 0.065 * prop.scale, prop.z]}
            rotation={[0, prop.rotation, 0]}
            scale={prop.scale}
          />
        ))}
      </Instances>
    </>
  );
}
