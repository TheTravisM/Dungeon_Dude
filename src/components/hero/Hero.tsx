import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier';
import { damp, damp3, dampAngle } from 'maath/easing';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';
import { createHeroTree } from '../../game/ai/HeroTree';
import { createHero, world } from '../../game/ecs';
import { getDungeonLayout } from '../../game/dungeon/getDungeonLayout';
import { buildNavGraph } from '../../game/pathfinding';
import { useGameStore } from '../../game/store';
import { usePlayerInput } from '../../hooks/usePlayerInput';
import type { Entity } from '../../types';
import TorchLight, { TorchFlame } from './TorchLight';

interface HeroProps {
  /** World position of the hero's feet, matching the dungeon spawn convention. */
  position: Vector3Tuple;
}

/** Walk speed in world units per second. */
const SPEED = 5;
/** Walk-cycle bob frequency (radians/second) and amplitude (world units). */
const WALK_FREQUENCY = 10;
const WALK_AMPLITUDE = 0.05;
/**
 * Squash-and-stretch walk cycle (05-06-01): the scale amplitudes. Shares the
 * bob's phase (WALK_FREQUENCY) so the hero stretches tall while rising and
 * squashes while dipping; the scale damps back to [1,1,1] when idle.
 */
const WALK_SQUASH_XZ = 0.05;
const WALK_SQUASH_Y = 0.1;
/**
 * Character-controller offset: the small stability gap Rapier keeps between
 * the hero's collider and its surroundings.
 */
const CHARACTER_CONTROLLER_OFFSET = 0.05;
/**
 * Initial heading: the three-quarter view facing the fixed isometric camera,
 * using the model's local -Z forward convention.
 */
const INITIAL_HEADING = -Math.PI * 0.75;
/**
 * Camera offset from the hero, kept on the (1,1,1) diagonal so the damped
 * follow preserves the diorama's isometric angle. For an orthographic camera
 * the offset length only affects depth, never the zoom.
 */
const CAMERA_OFFSET: [number, number, number] = [10, 10, 10];
/**
 * Cinematic look-ahead (05-07-01): how far in front of the hero the camera
 * target leads along the current movement direction, in world units.
 * Derived from SPEED so the lead stays proportional if walk speed changes.
 */
const LOOK_AHEAD_FACTOR = SPEED * 0.5;
/**
 * Cinematic look-at lead (05-07-01 follow-up): how far in front of the hero
 * the camera aims while it moves, in world units; idle it settles back on
 * the hero.
 */
const LOOK_AT_LEAD = 1;
/** Torch anchor: the flame in the right hand, in body-local space. */
const TORCH_ANCHOR: [number, number, number] = [0.38, 1.05, -0.02];

/** Scratch vector so the frame loop does not allocate. */
const scratchMove = new THREE.Vector3();

/**
 * Playable hero: a kinematic rigid body driven by player input, the visual
 * model, the stable torch spotlight, and the isometric camera follow. The
 * ECS entity mirrors the body so AI and debug systems can read the player
 * without touching the physics world.
 *
 * The body itself never rotates. The heading is applied to the walk-cycle
 * group and the torch anchor, which keeps the auto-generated cuboid collider
 * axis aligned and the spotlight free of the walk-cycle bob.
 */
export default function Hero({ position }: HeroProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<THREE.Group>(null);
  const torchRef = useRef<THREE.Group>(null);
  const headingRef = useRef({ y: INITIAL_HEADING });
  const entityRef = useRef<Entity | null>(null);
  const { sample } = usePlayerInput();

  // Kinematic character controller: the offset is a small stability gap, and
  // autostep stays disabled so the hero cannot climb the diorama walls.
  // (Renamed from the contract's `world` to avoid the ECS `world` import.)
  const { world: physicsWorld } = useRapier();
  // The character controller is a WASM handle that must be created on mount
  // and freed on cleanup. Keeping its whole lifecycle in an effect (rather
  // than a useMemo) makes it StrictMode-safe: the simulated unmount frees the
  // handle and the re-mount recreates it, so the frame loop always holds a
  // live controller instead of a freed one.
  const characterControllerRef = useRef<
    ReturnType<typeof physicsWorld.createCharacterController> | null
  >(null);
  useEffect(() => {
    const cc = physicsWorld.createCharacterController(
      CHARACTER_CONTROLLER_OFFSET
    );
    cc.disableAutostep();
    characterControllerRef.current = cc;
    return () => {
      physicsWorld.removeCharacterController(cc);
      characterControllerRef.current = null;
    };
  }, [physicsWorld]);

  // Auto-pilot: the layout is cached per seed, so deriving it here is free.
  // The tree and its blackboard are created once per layout; a depth change
  // rebuilds both.
  const currentDepth = useGameStore((state) => state.currentDepth);
  const layout = useMemo(() => getDungeonLayout(currentDepth), [currentDepth]);
  const navGraph = useMemo(() => buildNavGraph(layout), [layout]);
  const ai = useMemo(
    () => createHeroTree(navGraph, layout.floorCells, world, layout.seed),
    [navGraph, layout.floorCells, layout.seed]
  );

  // The spawn coordinates as individual deps: the effect re-runs when the
  // prop changes, so the entity is always created at the same spawn as the
  // body, and the cleanup removes the previous entity.
  const [spawnX, spawnY, spawnZ] = position;
  useEffect(() => {
    const entity = createHero(new THREE.Vector3(spawnX, spawnY, spawnZ));
    world.update(entity, { isPlayer: true, heading: INITIAL_HEADING });
    entityRef.current = entity;
    return () => {
      world.remove(entity);
      entityRef.current = null;
    };
  }, [spawnX, spawnY, spawnZ]);

  useFrame((state, delta) => {
    const body = bodyRef.current;
    if (!body) return;
    const input = sample();
    const pos = body.translation();

    // 1. Resolve the effective movement direction. sample() runs first so a
    //    key press flips the mode back to manual before it is read here.
    let moveDir: THREE.Vector3 | null = null;
    if (useGameStore.getState().isAutoMode) {
      ai.blackboard.position.copy(pos);
      ai.tree.step();
      if (ai.blackboard.outputDirection.lengthSq() > 0) {
        moveDir = ai.blackboard.outputDirection;
      }
    } else if (input.isMoving) {
      moveDir = input.direction;
    }

    if (moveDir) {
      const move = scratchMove.copy(moveDir).multiplyScalar(SPEED * delta);
      const collider = body.collider(0);
      const cc = characterControllerRef.current;
      if (collider && cc) {
        // Compute safe movement: the character controller slides the hero
        // along walls instead of clipping through them.
        cc.computeColliderMovement(collider, move);
        const corrected = cc.computedMovement();
        body.setNextKinematicTranslation({
          x: pos.x + corrected.x,
          y: pos.y + corrected.y,
          z: pos.z + corrected.z,
        });
      }
    }

    // 2. Face the movement direction (shortest path), hold it when idle.
    const targetHeading = moveDir
      ? Math.atan2(-moveDir.x, -moveDir.z)
      : headingRef.current.y;
    dampAngle(headingRef.current, 'y', targetHeading, 0.15, delta);
    if (visualRef.current) visualRef.current.rotation.y = headingRef.current.y;
    if (torchRef.current) torchRef.current.rotation.y = headingRef.current.y;

    // 3. Walk cycle: bob and squash-and-stretch the visual group only,
    //    never the torch light. One shared phase keeps the two in sync: the
    //    hero stretches tall while rising and squashes while dipping.
    if (visualRef.current) {
      if (moveDir) {
        const walkCycle = Math.sin(state.clock.elapsedTime * WALK_FREQUENCY);
        damp(
          visualRef.current.position,
          'y',
          walkCycle * WALK_AMPLITUDE,
          0.1,
          delta
        );
        visualRef.current.scale.set(
          1 - walkCycle * WALK_SQUASH_XZ, // Squash X
          1 + walkCycle * WALK_SQUASH_Y, // Stretch Y
          1 - walkCycle * WALK_SQUASH_XZ // Squash Z
        );
      } else {
        damp(visualRef.current.position, 'y', 0, 0.1, delta);
        // Smoothly return to resting scale when idle.
        damp3(visualRef.current.scale, [1, 1, 1], 0.1, delta);
      }
    }

    // 4. Cinematic camera follow with velocity look-ahead (05-07-01): the
    //    target is the isometric offset plus a push in the movement
    //    direction, so the view leads the hero while it walks and settles
    //    back behind it when it stops. The array target keeps damp3
    //    allocation-free.
    const lookAheadX = moveDir ? moveDir.x * LOOK_AHEAD_FACTOR : 0;
    const lookAheadZ = moveDir ? moveDir.z * LOOK_AHEAD_FACTOR : 0;
    damp3(
      state.camera.position,
      [
        pos.x + CAMERA_OFFSET[0] + lookAheadX,
        pos.y + CAMERA_OFFSET[1],
        pos.z + CAMERA_OFFSET[2] + lookAheadZ,
      ],
      0.2,
      delta
    );
    // The look point leads the hero by LOOK_AT_LEAD while it moves, so the
    // view frames more of the path ahead; when idle it settles back on the
    // hero.
    const lookLeadX = moveDir ? moveDir.x * LOOK_AT_LEAD : 0;
    const lookLeadZ = moveDir ? moveDir.z * LOOK_AT_LEAD : 0;
    state.camera.lookAt(pos.x + lookLeadX, pos.y, pos.z + lookLeadZ);

    // 5. Mirror the body into the ECS entity for AI and debug systems.
    const entity = entityRef.current;
    if (entity) {
      if (entity.position) entity.position.set(pos.x, pos.y, pos.z);
      if (entity.velocity) {
        entity.velocity[0] = moveDir ? moveDir.x * SPEED : 0;
        entity.velocity[1] = 0;
        entity.velocity[2] = moveDir ? moveDir.z * SPEED : 0;
      }
      entity.heading = headingRef.current.y;
    }
  });
  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="cuboid"
      canSleep={false}
      lockRotations
      position={position}
    >
      {/* Walk-cycle visual: bobs in Y and rotates toward the heading. */}
      <group ref={visualRef} rotation={[0, INITIAL_HEADING, 0]}>
        <HeroModel />
      </group>

      {/* Torch anchor: stable (no bob), rotates toward the heading. */}
      <group ref={torchRef} position={TORCH_ANCHOR} rotation={[0, INITIAL_HEADING, 0]}>
        <TorchLight />
      </group>
    </RigidBody>
  );
}

/**
 * Hero silhouette built only from primitive boxes. The model is intentionally
 * a separate visual component: movement, ECS registration, physics, input, and
 * AI stay out of it so later steps can wrap this group without rewriting the
 * look. Local forward is -Z and the feet sit at the group origin.
 *
 * Scale is roughly 1.3 world units tall, inside the approved 1.4-unit capsule.
 * Shoulders stay under the 0.28 capsule radius so the model does not visibly
 * clip through one-tile corridors.
 */
function HeroModel() {
  return (
    <group>
      {/* Boots and legs. The gap between them keeps the silhouette readable. */}
      <mesh position={[-0.11, 0.07, -0.03]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.14, 0.26]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.92} />
      </mesh>
      <mesh position={[0.11, 0.07, -0.03]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.14, 0.26]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.92} />
      </mesh>
      <mesh position={[-0.11, 0.31, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.34, 0.17]} />
        <meshStandardMaterial color="#2c3646" roughness={0.95} />
      </mesh>
      <mesh position={[0.11, 0.31, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.34, 0.17]} />
        <meshStandardMaterial color="#2c3646" roughness={0.95} />
      </mesh>

      {/* Torso, belt, and a short cloak panel behind the body. */}
      <mesh position={[0, 0.69, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.46, 0.25]} />
        <meshStandardMaterial color="#355a6b" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.49, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.41, 0.08, 0.27]} />
        <meshStandardMaterial color="#5b3b25" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.49, -0.145]} castShadow>
        <boxGeometry args={[0.07, 0.06, 0.02]} />
        <meshStandardMaterial color="#8a94a3" roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.68, 0.17]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.56, 0.07]} />
        <meshStandardMaterial color="#2b5c58" roughness={0.92} />
      </mesh>

      {/* Shoulders, arms, and hands. Right hand holds the torch; left holds the sword. */}
      <mesh position={[-0.235, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.13, 0.12, 0.24]} />
        <meshStandardMaterial color="#244b49" roughness={0.9} />
      </mesh>
      <mesh position={[0.235, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.13, 0.12, 0.24]} />
        <meshStandardMaterial color="#244b49" roughness={0.9} />
      </mesh>
      <mesh position={[-0.245, 0.68, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.11, 0.32, 0.15]} />
        <meshStandardMaterial color="#2f5060" roughness={0.9} />
      </mesh>
      <mesh position={[0.245, 0.68, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.11, 0.32, 0.15]} />
        <meshStandardMaterial color="#2f5060" roughness={0.9} />
      </mesh>
      <mesh position={[-0.245, 0.49, -0.01]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.12]} />
        <meshStandardMaterial color="#c58a62" roughness={0.85} />
      </mesh>
      <mesh position={[0.245, 0.49, -0.01]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.12]} />
        <meshStandardMaterial color="#c58a62" roughness={0.85} />
      </mesh>

      {/* Head, hood crown, back hood, and a small visible face plane. */}
      <mesh position={[0, 1.07, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.3, 0.27]} />
        <meshStandardMaterial color="#c58a62" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.235, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.12, 0.32]} />
        <meshStandardMaterial color="#244b49" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.08, 0.14]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.32, 0.09]} />
        <meshStandardMaterial color="#244b49" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.03, -0.145]} castShadow>
        <boxGeometry args={[0.2, 0.14, 0.02]} />
        <meshStandardMaterial color="#d49a72" roughness={0.8} />
      </mesh>

      {/*
        Torch in the right hand. The group is tilted outward so the handle and
        head clear the arm instead of reading as one dark column. The flame is
        visual only; the shadow-casting spotlight is anchored to the body.
      */}
      <group position={[0.315, 0.49, -0.02]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.055, 0.5, 0.055]} />
          <meshStandardMaterial color="#4a2f1c" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.075, 0.08, 0.075]} />
          <meshStandardMaterial color="#2b1d12" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.47, 0]} castShadow>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial color="#3a2a1e" roughness={0.7} metalness={0.35} />
        </mesh>
        <group position={[0, 0.56, 0]}>
          <TorchFlame />
        </group>
      </group>

      {/*
        Sword in the left hand: leather grip, steel crossguard and pommel, a
        tapered blade, and a small glowing gem. The outward tilt keeps the whole
        silhouette readable from the fixed isometric camera.
      */}
      <group position={[-0.315, 0.49, -0.02]} rotation={[0, 0, 0.14]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.055, 0.2, 0.055]} />
          <meshStandardMaterial color="#4a2f1c" roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.03, 0]} castShadow>
          <boxGeometry args={[0.09, 0.07, 0.09]} />
          <meshStandardMaterial color="#aab6c4" roughness={0.4} metalness={0.45} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.3, 0.06, 0.08]} />
          <meshStandardMaterial color="#b9c4d2" roughness={0.35} metalness={0.45} />
        </mesh>
        <mesh position={[0, 0.53, 0]} castShadow>
          <boxGeometry args={[0.09, 0.56, 0.03]} />
          <meshStandardMaterial color="#dbe5f0" roughness={0.3} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.055, 0.08, 0.03]} />
          <meshStandardMaterial color="#eef4fa" roughness={0.25} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.22, -0.045]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial
            color="#ffcf7a"
            emissive="#e8a33d"
            emissiveIntensity={1.5}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}
