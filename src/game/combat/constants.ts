/** Shared combat timing and tuning values. */

/** Flash, stagger, and no-re-hit window for a damaged monster. */
export const MONSTER_HURT_MS = 180;
/** Invulnerability window for the hero after taking a hit. */
export const HERO_IFRAME_MS = 700;
/** Knockback speed applied to a hit monster, in world units per second. */
export const KNOCKBACK_SPEED = 4.0;
/** Knockback duration; about 0.6 world units of total travel. */
export const KNOCKBACK_MS = 150;
/** Extra reach beyond attackRange that still allows a landed strike. */
export const STRIKE_GRACE = 0.3;
/** Forward lunge shown after a monster strike lands. */
export const MONSTER_LUNGE_MS = 120;
/** Hero death is deferred to 06-09. */
export const HERO_DEATH_ENABLED = false;
