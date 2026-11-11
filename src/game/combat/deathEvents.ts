export interface DeathEvent {
  id: string;
  atMs: number;
}

/** Fixed ring buffer capacity; overflow overwrites the oldest event. */
const CAPACITY = 32;

const events: DeathEvent[] = Array.from({ length: CAPACITY }, () => ({
  id: '',
  atMs: 0,
}));

let head = 0;
let count = 0;

/** Queues one death. 06-09 consumes this to remove and reward the monster. */
export function pushDeath(id: string, atMs: number): void {
  const index = count < CAPACITY ? (head + count) % CAPACITY : head;
  events[index].id = id;
  events[index].atMs = atMs;
  if (count < CAPACITY) count += 1;
  else head = (head + 1) % CAPACITY;
}

/** Visits queued deaths oldest first, then empties the queue. */
export function drainDeaths(visit: (event: DeathEvent) => void): void {
  for (let offset = 0; offset < count; offset++) {
    visit(events[(head + offset) % CAPACITY]);
  }
  head = 0;
  count = 0;
}
