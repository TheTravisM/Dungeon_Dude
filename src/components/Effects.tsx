import { EffectComposer, Noise, TiltShift, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { Dither } from './effects/Dither';

/**
 * Flip this off to compare the raw render against the stylized pipeline while
 * tuning values. It mirrors the camera debug flag so the whole scene can be
 * inspected without deleting code.
 */
const EFFECTS_ENABLED = true;

/**
 * Order matters. Tilt shift blurs first so the dither pattern stays crisp,
 * then grain adds analog texture, and the vignette frames the diorama last.
 * Blend functions are passed explicitly because the library wrappers use
 * sentinel defaults that can otherwise skip an effect entirely.
 */
export default function Effects() {
  if (!EFFECTS_ENABLED) return null;

  return (
    <EffectComposer multisampling={4}>
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
