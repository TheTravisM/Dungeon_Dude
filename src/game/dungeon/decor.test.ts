import { describe, expect, it } from 'vitest';
import { generateDungeon } from './generateDungeon';
import { generateDecor } from './decor';
import { gridToWorld } from './constants';

const layout = generateDungeon(4242);

describe('generateDecor', () => {
  it('is deterministic for a layout', () => {
    expect(generateDecor(layout)).toEqual(generateDecor(layout));
  });

  it('assigns one theme per room', () => {
    const decor = generateDecor(layout);
    expect(decor.themes).toHaveLength(layout.rooms.length);
    expect(decor.themes[0]).toBe('entrance');
  });

  it('places every prop on a walkable cell', () => {
    const floor = new Set(
      layout.floorCells.map(
        (cell) =>
          `${gridToWorld(cell.x, layout.size)},${gridToWorld(cell.z, layout.size)}`
      )
    );
    for (const prop of generateDecor(layout).props) {
      expect(floor.has(`${prop.x},${prop.z}`)).toBe(true);
    }
  });

  it('produces a useful amount of dressing without flooding a room', () => {
    const decor = generateDecor(layout);
    expect(decor.props.length).toBeGreaterThan(layout.rooms.length * 2);
    expect(decor.decals.length).toBeGreaterThan(layout.rooms.length);
    expect(decor.sconces.length).toBeGreaterThan(5);
  });
});
