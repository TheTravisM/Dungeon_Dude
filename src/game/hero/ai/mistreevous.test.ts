import { describe, expect, it } from 'vitest';
import { BehaviourTree, State } from 'mistreevous';

/**
 * Pins the mistreevous 4.3.1 tick semantics the hero brain relies on, so a
 * future version bump that changes stepping behavior fails loudly instead of
 * silently breaking auto-pilot. Every case drives the same tiny tree:
 *
 *   root { selector { sequence { condition [HasRoute] action [Follow] } action [Plan] } }
 *
 * The agent records each leaf it runs, in order, plus per-leaf call counts, so
 * the assertions read as a plain list of what the tree did.
 */

const TREE = 'root { selector { sequence { condition [HasRoute] action [Follow] } action [Plan] } }';

interface Script {
  hasRoute: boolean;
  /** States Follow returns, in order; the last one repeats once exhausted. */
  follow: State[];
}

function makeAgent(script: Script) {
  const log: string[] = [];
  let hasRouteCalls = 0;
  let followCalls = 0;
  let planCalls = 0;

  const agent = {
    log,
    counts: () => ({ HasRoute: hasRouteCalls, Follow: followCalls, Plan: planCalls }),
    HasRoute() {
      hasRouteCalls += 1;
      log.push('HasRoute');
      return script.hasRoute;
    },
    Follow() {
      const index = followCalls;
      followCalls += 1;
      log.push('Follow');
      return script.follow[Math.min(index, script.follow.length - 1)];
    },
    Plan() {
      planCalls += 1;
      log.push('Plan');
      return State.SUCCEEDED;
    },
  };

  return agent;
}

/** Runs one tick and returns only the leaves that ran during that tick. */
function tick(tree: BehaviourTree, log: string[]): string[] {
  const before = log.length;
  tree.step();
  return log.slice(before);
}

describe('mistreevous 4.3.1 tick semantics (pinned for the hero brain)', () => {
  it('falls through to Plan when HasRoute is false, running only Plan', () => {
    const agent = makeAgent({ hasRoute: false, follow: [State.SUCCEEDED] });
    const tree = new BehaviourTree(TREE, agent);

    expect(tick(tree, agent.log)).toEqual(['HasRoute', 'Plan']);
    expect(agent.counts()).toEqual({ HasRoute: 1, Follow: 0, Plan: 1 });
  });

  it('restarts a finished tree so the next step runs Plan again', () => {
    const agent = makeAgent({ hasRoute: false, follow: [State.SUCCEEDED] });
    const tree = new BehaviourTree(TREE, agent);

    tree.step();
    const second = tick(tree, agent.log);

    expect(second).toEqual(['HasRoute', 'Plan']);
    expect(agent.counts().Plan).toBe(2);
  });

  it('revisits a RUNNING Follow without re-evaluating HasRoute', () => {
    const agent = makeAgent({
      hasRoute: true,
      follow: [State.RUNNING, State.RUNNING, State.SUCCEEDED],
    });
    const tree = new BehaviourTree(TREE, agent);

    tree.step();
    tree.step();
    tree.step();

    expect(agent.counts()).toEqual({ HasRoute: 1, Follow: 3, Plan: 0 });
  });

  it('lets a failed Follow fall through to Plan in the same tick', () => {
    const agent = makeAgent({ hasRoute: true, follow: [State.RUNNING, State.FAILED] });
    const tree = new BehaviourTree(TREE, agent);

    tree.step();
    const second = tick(tree, agent.log);

    expect(second).toEqual(['Follow', 'Plan']);
  });

  it('accepts the options argument (seeded random) and still steps', () => {
    const log: string[] = [];
    const agent = {
      A() {
        log.push('A');
        return State.SUCCEEDED;
      },
    };
    const tree = new BehaviourTree('root { action [A] }', agent, { random: () => 0.5 });

    tree.step();

    expect(log).toEqual(['A']);
  });
});
