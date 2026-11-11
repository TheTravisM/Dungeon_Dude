export type DamageKind = 'dealt' | 'taken';

export interface DamageNumber {
  active: boolean;
  x: number;
  y: number;
  z: number;
  startMs: number;
  text: string;
  kind: DamageKind;
}

/** Fixed number of floating damage text slots. */
export const DAMAGE_NUMBER_POOL_SIZE = 12;
/** Total lifetime of one floating number. */
export const DAMAGE_NUMBER_LIFE_MS = 700;

const slots: DamageNumber[] = Array.from(
  { length: DAMAGE_NUMBER_POOL_SIZE },
  () => ({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    startMs: 0,
    text: '',
    kind: 'dealt',
  })
);

/**
 * Claims a free slot, or the oldest active one when all are busy, and writes
 * the number into it. Never allocates after startup.
 */
export function spawnDamageNumber(
  x: number,
  y: number,
  z: number,
  amount: number,
  kind: DamageKind,
  nowMs: number
): void {
  let slot = slots.find((candidate) => !candidate.active);

  if (!slot) {
    slot = slots[0];
    for (const candidate of slots) {
      if (candidate.startMs < slot.startMs) slot = candidate;
    }
  }

  slot.active = true;
  slot.x = x;
  slot.y = y;
  slot.z = z;
  slot.startMs = nowMs;
  slot.text = String(Math.max(1, Math.round(amount)));
  slot.kind = kind;
}

/**
 * Visits every live slot with its normalized age `t` in 0..1, deactivating
 * slots whose lifetime has elapsed.
 */
export function forEachDamageNumber(
  nowMs: number,
  visit: (slot: DamageNumber, t: number, index: number) => void
): void {
  for (let index = 0; index < slots.length; index++) {
    const slot = slots[index];
    if (!slot.active) continue;
    const t = (nowMs - slot.startMs) / DAMAGE_NUMBER_LIFE_MS;
    if (t >= 1) {
      slot.active = false;
      continue;
    }
    visit(slot, Math.max(0, t), index);
  }
}

/** Test helper: hides every slot so suites do not leak into each other. */
export function clearDamageNumbers(): void {
  for (const slot of slots) slot.active = false;
}
