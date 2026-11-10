import { BehaviourTree as BehaviorTree, State } from 'mistreevous';
import * as THREE from 'three';
import type { GridCell } from '../../types';
import { DUNGEON_SIZE, gridToWorld } from '../dungeon/constants';
import type { NavGraph } from '../pathfinding';

/**
 * The hero's wander tree in Mistreevous' string definition format. The
 * selector prefers the "no route yet" sequence: acquire a route, then follow
 * it. While a route exists the condition fails and the selector falls
 * through to moveAlongPath.
 */
const treeDefinition = `
root {
    selector {
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
 * Mistreevous action leaves reject boolean results at runtime, so the
 * actions report State.SUCCEEDED/State.FAILED instead of true/false.
 */
export function createHeroTree(navGraph: NavGraph, layoutCells: GridCell[]) {
    const blackboard = {
        navGraph,
        layoutCells,
        position: new THREE.Vector3(),
        currentPath: [] as GridCell[],
        outputDirection: new THREE.Vector3(),

        needsDestination: () => blackboard.currentPath.length === 0,

        findDestination: () => {
            const target = layoutCells[Math.floor(Math.random() * layoutCells.length)];
            const startX = Math.round(worldToGrid(blackboard.position.x));
            const startZ = Math.round(worldToGrid(blackboard.position.z));

            blackboard.currentPath = navGraph.findPath(startX, startZ, target.x, target.z);
            return blackboard.currentPath.length > 0 ? State.SUCCEEDED : State.FAILED;
        },

        moveAlongPath: () => {
            if (blackboard.currentPath.length === 0) return State.FAILED;

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
    };

    const tree = new BehaviorTree(treeDefinition, blackboard);
    return { tree, blackboard };
}