import { useRef, useState } from 'react';
import { Line } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { DoubleSide } from 'three';
import {
  FLOOR_TOP,
  gridToWorld,
  worldToGrid,
} from '../../game/dungeon/constants';
import { heroQuery } from '../../game/ecs';
import {
  planWorldPath,
  type WorldPoint,
} from '../../game/hero/navigation/heroPath';
import { routeState, setRoute } from '../../game/hero/navigation/routeState';
import { smoothPath } from '../../game/hero/navigation/smoothPath';
import { createWalkGrid } from '../../game/hero/navigation/walkGrid';
import { useGameStore } from '../../game/store';
import type { DungeonLayout } from '../../types';

/** Slightly above the floor so the line never z-fights with the tiles. */
const LINE_HEIGHT = FLOOR_TOP + 0.05;
const LINE_COLOR = '#ffb877';

type LinePoint = [number, number, number];

interface PathDebugProps {
  layout: DungeonLayout;
}

/**
 * Development-only route overlay. It reads the module-level route singleton and
 * rebuilds the line only when its version changes, so normal play allocates
 * nothing per frame. Clicking the floor plans a route from the hero to that
 * cell through the same planner the AI will use.
 *
 * The whole component is inert when `import.meta.env.DEV` is false, so the
 * production bundle drops the drawing path.
 */
export default function PathDebug({ layout }: PathDebugProps) {
  const pathDebug = useGameStore((state) => state.pathDebug);
  const enabled = import.meta.env.DEV && pathDebug;

  const [points, setPoints] = useState<WorldPoint[]>([]);
  const [goal, setGoal] = useState<WorldPoint | null>(null);
  const versionRef = useRef(-1);

  useFrame(() => {
    if (!enabled) return;
    if (versionRef.current === routeState.version) return;

    versionRef.current = routeState.version;
    setPoints(routeState.points);
    setGoal(routeState.goal);
  });

  if (!enabled) return null;

  const handleFloorClick = (event: ThreeEvent<MouseEvent>) => {
    const heroPosition = heroQuery.first?.position;
    if (!heroPosition) return;
    event.stopPropagation();

    const from = { x: heroPosition.x, z: heroPosition.z };
    const target = { x: event.point.x, z: event.point.z };
    const raw = planWorldPath(layout, from, target);
    if (!raw) return;

    // Snap the ring to the clicked cell center rather than the raw click point.
    const goalCell = {
      x: worldToGrid(target.x, layout.size),
      z: worldToGrid(target.z, layout.size),
    };
    const snappedGoal = {
      x: gridToWorld(goalCell.x, layout.size),
      z: gridToWorld(goalCell.z, layout.size),
    };

    setRoute(smoothPath(createWalkGrid(layout), from, raw), snappedGoal);
  };

  const linePoints: LinePoint[] = points.map((point) => [
    point.x,
    LINE_HEIGHT,
    point.z,
  ]);

  return (
    <group>
      {/* Invisible picking plane so a click anywhere on the floor can plan. */}
      <mesh
        position={[0, FLOOR_TOP, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[layout.size, layout.size]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* The line starts at the first waypoint to avoid per-frame churn. */}
      {linePoints.length > 1 && (
        <Line points={linePoints} color={LINE_COLOR} lineWidth={2} />
      )}

      {goal && (
        <mesh
          position={[goal.x, LINE_HEIGHT, goal.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.16, 0.24, 24]} />
          <meshBasicMaterial
            color={LINE_COLOR}
            side={DoubleSide}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
