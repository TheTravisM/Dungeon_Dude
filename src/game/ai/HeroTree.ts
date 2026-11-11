import { BehaviourTree as BehaviorTree, State } from 'mistreevous';
import * as THREE from 'three';
import type { Entity, GridCell } from '../../types';
import type { World } from 'miniplex';
import { DUNGEON_DEFAULT_SEED, DUNGEON_SIZE, gridToWorld } from '../dungeon/constants';
import { createRandom } from '../dungeon/random';
import type { NavGraph } from '../pathfinding';
import { world as ecsWorld } from '../ecs';
import { useGameStore } from '../store';

/**
 * Store-side effects the tree fires instead of touching the Zustand store
 * directly, keeping the AI module pure with respect to React. The hero
 * component wires the callbacks to the store, which stays the canonical
 * HUD state.
 */
export interface HeroTreeEvents {
    onKeyPickedUp: () => void;
    onDescend: () => void;
}

/**
 * The hero's objective tree in Mistreevous' string definition format. The
 * selector resolves priorities: key first, then stairs, otherwise random
 * exploration. `interact` leads the key and stairs sequences as a
 * side-effect gate: it checks grid proximity, fires the pickup or descent,
 * and always succeeds so the sequence can continue into path acquisition
 * and movement.
 */
const treeDefinition = `
root {
    selector {
        sequence {
            condition [ needsKey ]
            action [ interact ]
            sequence {
                condition [ needsDestination ]
                action [ findKey ]
            }
            action [ moveAlongPath ]
        }
        sequence {
            condition [ hasKey ]
            action [ interact ]
            sequence {
                condition [ needsDestination ]
                action [ findStairs ]
            }
            action [ moveAlongPath ]
        }
        sequence {
            condition [ needsDestination ]
            action [ findDestination ]
        }
        action [ moveAlongPath ]
    }
}
`;

/**
 * Inverse of gridToWorld. The nav graph and currentPath live in grid space
 * while position and outputDirection live in world space, so every crossing
 * between the two goes through these two transforms.
 */
const worldToGrid = (world: number): number => world + (DUNGEON_SIZE - 1) / 2;

/**
 * Creates the hero's auto-pilot behaviour tree. The blackboard is the
 * Mistreevous agent: the tree reads and mutates it, and its named functions
 * are the condition and action leaves.
 *
 * `world` defaults to the shared ECS world so the existing two-argument call
 * site in `Hero.tsx` keeps working. `seed` defaults to the dungeon default
 * seed; `Hero.tsx` passes the layout's seed so wander is reproducible per
 * depth, matching the project's deterministic-seed convention. `events` has
 * no default: every call site must pass it, so the tree never reaches for
 * the store.
 *
 * Mistreevous action leaves reject boolean results at runtime, so the
 * actions report State.SUCCEEDED/State.FAILED instead of true/false.
 * Condition leaves must be functions, so the raw key state lives in
 * `hasKeyState` and `hasKey` is the condition leaf.
 */
export function createHeroTree(
    navGraph: NavGraph,
    layoutCells: GridCell[],
    world: World<Entity> = ecsWorld,
    seed: number = DUNGEON_DEFAULT_SEED,
    events: HeroTreeEvents
) {
    // The POI query is a live view of the world: entities added later (the
    // Step 6 spawners) are reflected without re-creating the query.
    const poiQuery = world.with('poiType', 'position', 'isActive');

    // Seeded wander: the same depth always wanders the same way, which keeps
    // auto-pilot runs reproducible for debugging and tests.
    const random = createRandom(seed);

    const blackboard = {
        navGraph,
        layoutCells,
        position: new THREE.Vector3(),
        currentPath: [] as GridCell[],
        outputDirection: new THREE.Vector3(),
        /** Human-readable intent for the in-world AI status label. */
        activeState: 'Idle',

        hasKeyState: false,
        hasKey: () => blackboard.hasKeyState,
        needsKey: () => !blackboard.hasKeyState,
        needsDestination: () => blackboard.currentPath.length === 0,

        findDestination: () => {
            blackboard.activeState = 'Wandering';
            const target = random.pick(layoutCells);
            const startX = Math.round(worldToGrid(blackboard.position.x));
            const startZ = Math.round(worldToGrid(blackboard.position.z));

            blackboard.currentPath = navGraph.findPath(startX, startZ, target.x, target.z);
            return blackboard.currentPath.length > 0 ? State.SUCCEEDED : State.FAILED;
        },

        /**
         * Nearest active POI of the given type by squared grid distance from
         * the hero. Ties break by entity order, which is stable for a given
         * spawn order. Returns undefined when no active POI of that type
         * exists, matching the old first-match behaviour's failure case.
         */
        nearestActivePoi: (poiType: NonNullable<Entity['poiType']>) => {
            const heroX = Math.round(worldToGrid(blackboard.position.x));
            const heroZ = Math.round(worldToGrid(blackboard.position.z));
            let best: Entity | undefined;
            let bestDistance = Infinity;
            for (const entity of poiQuery.entities) {
                if (entity.poiType !== poiType || !entity.isActive || !entity.position) continue;
                const dx = Math.round(worldToGrid(entity.position.x)) - heroX;
                const dz = Math.round(worldToGrid(entity.position.z)) - heroZ;
                const distance = dx * dx + dz * dz;
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = entity;
                }
            }
            return best;
        },

        findKey: () => {
            blackboard.activeState = 'Seeking Key';
            const keyEntity = blackboard.nearestActivePoi('key');
            if (!keyEntity?.position) return State.FAILED;
            return blackboard.acquirePathTo(keyEntity.position);
        },

        findStairs: () => {
            blackboard.activeState = 'Seeking Stairs';
            const stairsEntity = blackboard.nearestActivePoi('stairs');
            if (!stairsEntity?.position) return State.FAILED;
            return blackboard.acquirePathTo(stairsEntity.position);
        },

        acquirePathTo: (worldPos: THREE.Vector3) => {
            const startX = Math.round(worldToGrid(blackboard.position.x));
            const startZ = Math.round(worldToGrid(blackboard.position.z));

            blackboard.currentPath = navGraph.findPath(
                startX,
                startZ,
                Math.round(worldToGrid(worldPos.x)),
                Math.round(worldToGrid(worldPos.z))
            );
            return blackboard.currentPath.length > 0 ? State.SUCCEEDED : State.FAILED;
        },

        moveAlongPath: () => {
            if (blackboard.currentPath.length === 0) {
                blackboard.activeState = 'Idle';
                return State.FAILED;
            }

            const nextNode = blackboard.currentPath[0];
            const targetPos = new THREE.Vector3(
                gridToWorld(nextNode.x),
                blackboard.position.y,
                gridToWorld(nextNode.z)
            );
            const dist = blackboard.position.distanceTo(targetPos);

            if (dist < 0.1) {
                blackboard.currentPath.shift(); // Reached node, pop it
                blackboard.outputDirection.set(0, 0, 0);
            } else {
                blackboard.outputDirection.subVectors(targetPos, blackboard.position).normalize();
            }
            return State.SUCCEEDED;
        },

        interact: () => {
            const heroX = Math.round(worldToGrid(blackboard.position.x));
            const heroZ = Math.round(worldToGrid(blackboard.position.z));

            const keyEntity = blackboard.nearestActivePoi('key');
            if (keyEntity?.position) {
                const keyX = Math.round(worldToGrid(keyEntity.position.x));
                const keyZ = Math.round(worldToGrid(keyEntity.position.z));
                if (heroX === keyX && heroZ === keyZ) {
                    blackboard.hasKeyState = true;
                    blackboard.activeState = 'Key Acquired';
                    // The callback writes the canonical key state for the
                    // HUD and any future systems; the blackboard copy drives
                    // the tree.
                    events.onKeyPickedUp();
                    world.update(keyEntity, { isActive: false });
                }
            }

            if (blackboard.hasKeyState) {
                const stairsEntity = blackboard.nearestActivePoi('stairs');
                if (stairsEntity?.position) {
                    const stairsX = Math.round(worldToGrid(stairsEntity.position.x));
                    const stairsZ = Math.round(worldToGrid(stairsEntity.position.z));
                    if (heroX === stairsX && heroZ === stairsZ) {
                        blackboard.activeState = 'Descending';
                        world.update(stairsEntity, { isActive: false });
                        events.onDescend();
                    }
                }
            }

            return State.SUCCEEDED;
        },
    };

    const tree = new BehaviorTree(treeDefinition, blackboard);
    return { tree, blackboard };
}