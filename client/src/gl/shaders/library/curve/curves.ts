import { ShaderDefinition } from '../../ShaderDefinition';

export const curveGeneratorShader: ShaderDefinition = {
  id: 'curve-generator',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_preset', type: 'int' },
    { name: 'u_intensity', type: 'float' },
    { name: 'u_gamma', type: 'float' },
    { name: 'u_steps', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float x = uv.x;   // input value 0-1
  float y = x;       // start with identity

  // Preset 0: S-Curve (smooth contrast enhancement)
  if (u_preset == 0) {
    y = x * x * (3.0 - 2.0 * x);  // smoothstep
  }
  // Preset 1: Brighten (push mids up)
  else if (u_preset == 1) {
    y = 1.0 - pow(1.0 - x, 2.0);
  }
  // Preset 2: Darken (push mids down)
  else if (u_preset == 2) {
    y = pow(x, 2.0);
  }
  // Preset 3: High Contrast (steeper S-curve)
  else if (u_preset == 3) {
    float t = x * 2.0 - 1.0;
    y = (t * t * t + 1.0) * 0.5;
  }
  // Preset 4: Solarize (inverts highlights)
  else if (u_preset == 4) {
    y = x < 0.5 ? x * 2.0 : 2.0 - x * 2.0;
  }
  // Preset 5: Posterize (stair-step)
  else if (u_preset == 5) {
    float s = float(u_steps);
    y = floor(x * s) / (s - 1.0);
  }
  // Preset 6: Gamma
  else if (u_preset == 6) {
    y = pow(x, 1.0 / max(u_gamma, 0.001));
  }
  // Preset 7: Linear (identity)
  else {
    y = x;
  }

  // Blend with identity by intensity
  y = mix(x, y, u_intensity);
  y = clamp(y, 0.0, 1.0);
  return vec4(vec3(y), 1.0);
}
`,
};

export const levelsCurveShader: ShaderDefinition = {
  id: 'levels-curve',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_inBlack', type: 'float' },
    { name: 'u_inWhite', type: 'float' },
    { name: 'u_gamma', type: 'float' },
    { name: 'u_outBlack', type: 'float' },
    { name: 'u_outWhite', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float x = uv.x;

  // Input range mapping
  float range = max(u_inWhite - u_inBlack, 0.001);
  float t = clamp((x - u_inBlack) / range, 0.0, 1.0);

  // Gamma correction
  t = pow(t, 1.0 / max(u_gamma, 0.001));

  // Output range mapping
  float y = mix(u_outBlack, u_outWhite, t);
  y = clamp(y, 0.0, 1.0);

  return vec4(vec3(y), 1.0);
}
`,
};
