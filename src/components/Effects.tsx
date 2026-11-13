import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  DepthOfField,
  EffectComposer,
  TiltShift2,
  Vignette,
} from '@react-three/postprocessing';
import type { DepthOfFieldEffect } from 'postprocessing';
import {
  AUTOFOCUS_HEIGHT,
  DEPTH_OF_FIELD,
  TILT_SHIFT,
  VIGNETTE,
} from '../config/dioramaConfig';
import { heroQuery } from '../game/ecs';
import { useQualityStore } from '../game/quality/tierStore';

interface AutofocusProps {
  dof: RefObject<DepthOfFieldEffect | null>;
}

/**
 * Tracks the hero with the depth-of-field effect. The value is copied into the
 * effect instance every frame, so no prop changes and no React renders occur
 * during play. The target stays stable even while the hero moves between tiles.
 */
function Autofocus({ dof }: AutofocusProps) {
  useFrame(() => {
    const position = heroQuery.first?.position;
    const effect = dof.current;
    if (!position || !effect?.target) return;
    effect.target.set(position.x, position.y + AUTOFOCUS_HEIGHT, position.z);
  });

  return null;
}

/**
 * Two stable pipelines. High tier is a strong miniature depth of field with a
 * near-black vignette. Low tier swaps the depth pass for the cheaper
 * tilt-shift blur but keeps the same edge fade. The tier store only ever moves
 * downward, so this component re-renders at most once after startup.
 */
export default function Effects() {
  const tier = useQualityStore((state) => state.tier);
  const dofRef = useRef<DepthOfFieldEffect>(null);

  if (tier === 'low') {
    return (
      <EffectComposer multisampling={0}>
        <TiltShift2
          blur={TILT_SHIFT.blur}
          taper={TILT_SHIFT.taper}
          start={TILT_SHIFT.start}
          end={TILT_SHIFT.end}
          samples={TILT_SHIFT.samples}
        />
        <Vignette
          eskil={false}
          offset={VIGNETTE.offset}
          darkness={VIGNETTE.darkness}
        />
      </EffectComposer>
    );
  }

  return (
    <>
      <EffectComposer multisampling={0}>
        <DepthOfField
          ref={dofRef}
          bokehScale={DEPTH_OF_FIELD.bokehScale}
          focusRange={DEPTH_OF_FIELD.focusRange}
          resolutionScale={DEPTH_OF_FIELD.resolutionScale}
        />
        <Vignette
          eskil={false}
          offset={VIGNETTE.offset}
          darkness={VIGNETTE.darkness}
        />
      </EffectComposer>
      <Autofocus dof={dofRef} />
    </>
  );
}
