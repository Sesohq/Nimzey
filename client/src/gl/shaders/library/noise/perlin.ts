import { ShaderDefinition } from '../../ShaderDefinition';

export const perlinNoiseShader: ShaderDefinition = {
  id: 'perlin-noise',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_scale', type: 'float' },
    { name: 'u_stretch', type: 'float' },
    { name: 'u_angle', type: 'float' },
    { name: 'u_octaves', type: 'int' },
    { name: 'u_roughness', type: 'float' },
    { name: 'u_contrast', type: 'float' },
    { name: 'u_seed', type: 'int' },
    { name: 'u_color', type: 'vec3' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  // Apply rotation
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 centered = uv - 0.5;
  vec2 rotated = vec2(
    centered.x * cos(rad) - centered.y * sin(rad),
    centered.x * sin(rad) + centered.y * cos(rad)
  );

  // Apply stretch
  float stretchFactor = 1.0 + u_stretch * 0.01;
  rotated.x *= stretchFactor;

  vec2 p = (rotated + 0.5) * u_scale + float(u_seed) * 17.31;

  // FBM
  float value = fbm(p, u_octaves, u_roughness);

  // Normalize from [-0.5, 0.5] to [0, 1]
  value = value * 0.5 + 0.5;

  // Apply contrast
  if (u_contrast != 0.0) {
    float c = u_contrast / 100.0;
    if (c > 0.0) {
      value = mix(value, smoothstep(0.0, 1.0, value), c);
    } else {
      value = mix(value, 0.5, -c);
    }
  }

  value = clamp(value, 0.0, 1.0);
  return vec4(u_color * value, 1.0);
}`,
};
