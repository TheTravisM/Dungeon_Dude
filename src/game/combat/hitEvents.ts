export interface HitEvent {
  targetId: string;
  swingId: number;
  atMs: number;
}

/** Fixed ring buffer capacity; overflow overwrites the oldest event. */
const CAPACITY = 64;

const events: HitEvent[] = Array.from({ length: CAPACITY }, () => ({
  targetId: '',
  swingId: 0,
  atMs: 0,
}));

let head = 0;
let count = 0;

/** Development readout only; never drives gameplay. */
export const hitStats = { total: 0, lastTargetId: '' };

/** Queues one sword hit. Reuses a preallocated slot and never allocates. */
export function pushHit(
  targetId: string,
  swingId: number,
  atMs: number
): void {
  const index = count < CAPACITY ? (head + count) % CAPACITY : head;
  const event = events[index];
  event.targetId = targetId;
  event.swingId = swingId;
  event.atMs = atMs;
  if (count < CAPACITY) count += 1;
  else head = (head + 1) % CAPACITY;

  hitStats.total += 1;
  hitStats.lastTargetId = targetId;
}

/** Visits queued hits oldest first, then empties the queue. */
export function drainHits(visit: (event: HitEvent) => void): void {
  for (let offset = 0; offset < count; offset++) {
    visit(events[(head + offset) % CAPACITY]);
  }
  head = 0;
  count = 0;
}
