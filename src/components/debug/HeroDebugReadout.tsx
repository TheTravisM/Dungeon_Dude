import { useRef, type CSSProperties } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { inputState, manualWindowMsLeft } from '../../game/hero/input/inputState';

const READOUT_STYLE: CSSProperties = {
  position: 'fixed',
  left: 8,
  bottom: 8,
  padding: '4px 8px',
  background: 'rgba(0, 0, 0, 0.75)',
  color: '#dbe5f0',
  borderRadius: 4,
  fontFamily: 'monospace',
  fontSize: 11,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
};

/**
 * Development-only input readout. It writes textContent from the frame loop so
 * per-frame input never triggers React renders.
 */
export default function HeroDebugReadout() {
  const readoutRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const element = readoutRef.current;
    if (!element) return;

    const now = performance.now();
    const remaining = inputState.manualActive
      ? Math.max(0, Math.ceil(manualWindowMsLeft(now)))
      : 0;
    const mode = inputState.manualActive ? 'MANUAL' : 'AUTO';
    const { x, y } = inputState.axes;

    element.textContent =
      `${mode} | axes ${x.toFixed(2)}, ${y.toFixed(2)}` +
      ` | attack ${inputState.attack ? 'on' : 'off'}` +
      ` | ${remaining} ms left`;
  });

  if (!import.meta.env.DEV) return null;

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div ref={readoutRef} style={READOUT_STYLE} />
    </Html>
  );
}
