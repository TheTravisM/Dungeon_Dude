import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { installInputListeners, pollInput } from '../../game/hero/input/inputState';

/**
 * Installs the framework-free input listeners once and samples them every
 * frame. Rendered inside the Canvas because it uses `useFrame`; it renders no
 * scene objects.
 */
export default function InputBridge() {
  useEffect(() => installInputListeners(), []);
  useFrame(() => pollInput(performance.now()));
  return null;
}
