import { useRef, type CSSProperties } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import {
  DAMAGE_NUMBER_POOL_SIZE,
  forEachDamageNumber,
} from '../../game/combat/damageNumbers';

const TEXT_STYLE: CSSProperties = {
  display: 'none',
  fontFamily: 'var(--font-pixel)',
  fontSize: 10,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  textShadow: '0 1px 0 #000, 0 0 4px #000',
  pointerEvents: 'none',
  userSelect: 'none',
};

/** Fixed pool of drei HTML labels; the frame loop only mutates the DOM. */
export default function DamageNumbers() {
  const groups = useRef<(Group | null)[]>([]);
  const labels = useRef<(HTMLDivElement | null)[]>([]);

  useFrame(() => {
    for (const group of groups.current) if (group) group.visible = false;
    for (const label of labels.current) {
      if (label) label.style.display = 'none';
    }

    const now = performance.now();
    forEachDamageNumber(now, (slot, t, index) => {
      const group = groups.current[index];
      const label = labels.current[index];
      if (!group || !label) return;

      group.visible = true;
      group.position.set(slot.x, slot.y + 0.9 * t, slot.z);
      label.style.display = 'block';
      label.textContent = slot.text;
      label.style.opacity = String(1 - t);
      label.style.color = slot.kind === 'taken' ? '#ff4d4d' : '#fff3d6';
    });
  });

  return (
    <>
      {Array.from({ length: DAMAGE_NUMBER_POOL_SIZE }, (_, index) => (
        <group
          key={index}
          visible={false}
          ref={(node) => {
            groups.current[index] = node;
          }}
        >
          <Html center style={{ pointerEvents: 'none' }}>
            <div
              style={TEXT_STYLE}
              ref={(node) => {
                labels.current[index] = node;
              }}
            />
          </Html>
        </group>
      ))}
    </>
  );
}
