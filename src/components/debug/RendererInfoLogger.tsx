import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

const LOG_INTERVAL_MS = 2000;

/**
 * Development-only renderer report. It samples renderer.info at a low rate so
 * the numbers in docs/PERF_CHECKLIST.md reflect normal play without flooding
 * the console. Frames are counted over the interval to estimate FPS.
 */
export default function RendererInfoLogger() {
  const gl = useThree((state) => state.gl);
  const lastLog = useRef(0);
  const frames = useRef(0);

  useFrame(() => {
    const now = performance.now();
    frames.current++;

    if (now - lastLog.current < LOG_INTERVAL_MS) return;

    const seconds = (now - lastLog.current) / 1000;
    const fps = frames.current / seconds;
    const info = gl.info;
    console.info(
      `[renderer] fps=${fps.toFixed(1)} calls=${info.render.calls} tris=${info.render.triangles} textures=${info.memory.textures} geometries=${info.memory.geometries}`
    );

    frames.current = 0;
    lastLog.current = now;
  });

  return null;
}
