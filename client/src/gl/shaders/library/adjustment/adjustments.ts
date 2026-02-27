import { ShaderDefinition } from '../../ShaderDefinition';

export const brightnessContrastShader: ShaderDefinition = {
  id: 'brightness-contrast',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_brightness', type: 'float' },
    { name: 'u_contrast', type: 'float' },
    { name: 'u_preserveColor', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  float b = u_brightness / 100.0;
  float c = u_contrast / 100.0;

  vec3 result = color.rgb + b;
  result = (result - 0.5) * (1.0 + c) + 0.5;

  if (u_preserveColor == 1) {
    float origLum = luminance(color.rgb);
    float newLum = luminance(result);
    if (newLum > 0.001) result *= origLum / newLum;
  }

  return vec4(clamp(result, 0.0, 1.0), color.a);
}`,
};

export const levelsShader: ShaderDefinition = {
  id: 'levels',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_blackPoint', type: 'float' },
    { name: 'u_whitePoint', type: 'float' },
    { name: 'u_gamma', type: 'float' },
    { name: 'u_preserveColor', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  float bp = u_blackPoint / 100.0;
  float wp = u_whitePoint / 100.0;

  // Map gamma percentage to real gamma (0.1 to 10.0)
  float g = u_gamma / 100.0;
  float gamma = g >= 0.0 ? 1.0 / (1.0 + g * 9.0) : 1.0 + (-g) * 9.0;

  vec3 result = (color.rgb - bp) / max(wp - bp, 0.001);
  result = clamp(result, 0.0, 1.0);
  result = pow(result, vec3(gamma));

  if (u_preserveColor == 1) {
    float origLum = luminance(color.rgb);
    float newLum = luminance(result);
    if (newLum > 0.001) result *= origLum / newLum;
  }

  return vec4(result, color.a);
}`,
};

export const hueSaturationShader: ShaderDefinition = {
  id: 'hue-saturation',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_hue', type: 'float' },
    { name: 'u_saturation', type: 'float' },
    { name: 'u_lightness', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  vec3 hsl = rgb2hsl(color.rgb);

  hsl.x += u_hue / 360.0;
  hsl.x = fract(hsl.x);
  hsl.y = clamp(hsl.y + u_saturation / 100.0, 0.0, 1.0);
  hsl.z = clamp(hsl.z + u_lightness / 100.0, 0.0, 1.0);

  return vec4(hsl2rgb(hsl), color.a);
}`,
};

export const invertShader: ShaderDefinition = {
  id: 'invert',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_invert', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  if (u_invert == 1) {
    return vec4(1.0 - color.rgb, color.a);
  }
  return color;
}`,
};

export const gammaShader: ShaderDefinition = {
  id: 'gamma',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_gamma', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  float g = u_gamma / 100.0;
  float gamma = g >= 0.0 ? 1.0 / (1.0 + g * 9.0) : 1.0 + (-g) * 9.0;
  return vec4(pow(max(color.rgb, vec3(0.0)), vec3(gamma)), color.a);
}`,
};

export const desaturateShader: ShaderDefinition = {
  id: 'desaturate',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_method', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  float gray;

  if (u_method == 0) {
    // Weighted Average (HSY perceptual)
    gray = luminanceHSY(color.rgb);
  } else if (u_method == 1) {
    // Simple Average
    gray = (color.r + color.g + color.b) / 3.0;
  } else {
    // Lightness (HSB Brightness)
    gray = max(color.r, max(color.g, color.b));
  }

  return vec4(vec3(gray), color.a);
}`,
};

export const thresholdShader: ShaderDefinition = {
  id: 'threshold',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_threshold', type: 'float' },
    { name: 'u_smooth', type: 'float' },
    { name: 'u_lowColor', type: 'vec3' },
    { name: 'u_highColor', type: 'vec3' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  float lum = (color.r + color.g + color.b) / 3.0;
  float thresh = u_threshold / 100.0;
  float smooth_width = u_smooth / 100.0 * 0.5;

  float t;
  if (smooth_width > 0.001) {
    t = smoothstep(thresh - smooth_width, thresh + smooth_width, lum);
  } else {
    t = step(thresh, lum);
  }

  vec3 result = mix(u_lowColor, u_highColor, t);
  return vec4(result, color.a);
}`,
};

export const toneCurveShader: ShaderDefinition = {
  id: 'tone-curve',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_preserveColor', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec4 color = texture(u_input0, uv);
  // The curve input is a 1D LUT texture: x = input luminance, output = remapped value
  vec3 result;
  result.r = texture(u_input1, vec2(color.r, 0.5)).r;
  result.g = texture(u_input1, vec2(color.g, 0.5)).g;
  result.b = texture(u_input1, vec2(color.b, 0.5)).b;

  if (u_preserveColor == 1) {
    float origLum = luminance(color.rgb);
    float newLum = luminance(result);
    if (newLum > 0.001) result *= origLum / newLum;
  }

  return vec4(clamp(result, 0.0, 1.0), color.a);
}`,
};
