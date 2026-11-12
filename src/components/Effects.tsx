import {
  EffectComposer,
  Noise,
  SSAO,
  TiltShift,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { Dither } from './effects/Dither';

/**
 * Flip this off to compare the raw render against the stylized pipeline while
 * tuning values. It mirrors the camera debug flag so the whole scene can be
 * inspected without deleting code.
 */
const EFFECTS_ENABLED = true;

/**
 * Ambient occlusion grounds geometry before the stylized blur, dither, grain,
 * and vignette passes. SSAO runs at half resolution with a bounded sample
 * count to control its cost on GPUs below the primary RTX 3090 target.
 */
export default function Effects() {
  if (!EFFECTS_ENABLED) return null;

  return (
    <EffectComposer enableNormalPass multisampling={4}>
      <SSAO
        samples={16}
        rings={3}
        intensity={1.5}
        radius={0.4}
        bias={0.02}
        resolutionScale={0.5}
      />
      <TiltShift
        blendFunction={BlendFunction.NORMAL}
        offset={0}
        rotation={0}
        focusArea={0.75}
        feather={0.5}
        kernelSize={KernelSize.MEDIUM}
        resolutionScale={0.5}
      />
      <Dither strength={0.03} scale={2} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.06} premultiply />
      <Vignette
        blendFunction={BlendFunction.NORMAL}
        offset={0.35}
        darkness={0.5}
      />
    </EffectComposer>
  );
}
