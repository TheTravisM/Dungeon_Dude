import { wrapEffect } from '@react-three/postprocessing';
import { BlendFunction, Effect } from 'postprocessing';
import { Uniform } from 'three';

/**
 * Ordered dithering is what sells the printed miniature look. The current
 * postprocessing release no longer ships a Dither effect, so this is a small
 * custom effect that applies a 4x4 Bayer threshold without shifting the hue
 * of the scene. The pattern is subtle at low strength, so it reads as texture
 * rather than a retro filter.
 */
const fragmentShader = /* glsl */ `
uniform float strength;
uniform float scale;

/**
 * A 4x4 Bayer matrix built from two 2x2 quadrants. Doing the lookup with
 * arithmetic instead of an array keeps the shader portable across WebGL
 * targets, and avoids integer bit operations that older GLSL lacks.
 */
float bayer4(vec2 pixel) {
  vec2 cell = mod(floor(pixel), 4.0);
  float x0 = mod(cell.x, 2.0);
  float y0 = mod(cell.y, 2.0);
  float x1 = floor(cell.x * 0.5);
  float y1 = floor(cell.y * 0.5);
  float low = mod(3.0 * y0 + 2.0 * x0, 4.0);
  float high = mod(3.0 * y1 + 2.0 * x1, 4.0);
  return 4.0 * low + high;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 pixel = uv * resolution / max(scale, 1.0);
  float threshold = bayer4(pixel) / 16.0 - 0.5;

  // Adding a fixed offset to near-black pixels turns the empty dungeon into a
  // visible checkerboard. Fading the pattern in by luminance keeps dark areas
  // clean while still texturing lit stone and props.
  float luma = dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float amount = strength * smoothstep(0.015, 0.18, luma);

  vec3 dithered = inputColor.rgb + threshold * amount;
  outputColor = vec4(clamp(dithered, 0.0, 1.0), inputColor.a);
}
`;

interface DitherOptions {
  blendFunction?: BlendFunction;
  strength?: number;
  scale?: number;
}

class DitherEffect extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    strength = 0.03,
    scale = 2,
  }: DitherOptions = {}) {
    super('DitherEffect', fragmentShader, {
      blendFunction,
      uniforms: new Map<string, Uniform>([
        ['strength', new Uniform(strength)],
        ['scale', new Uniform(scale)],
      ]),
    });
  }

  // wrapEffect pierces props onto the effect instance, so these setters keep
  // the uniforms live whenever React re-renders with new values.
  get strength(): number {
    return Number(this.uniforms.get('strength')?.value ?? 0);
  }

  set strength(value: number) {
    const uniform = this.uniforms.get('strength');
    if (uniform) uniform.value = value;
  }

  get scale(): number {
    return Number(this.uniforms.get('scale')?.value ?? 1);
  }

  set scale(value: number) {
    const uniform = this.uniforms.get('scale');
    if (uniform) uniform.value = value;
  }
}

export const Dither = wrapEffect(DitherEffect);
