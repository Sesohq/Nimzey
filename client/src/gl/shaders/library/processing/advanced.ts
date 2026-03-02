import { ShaderDefinition } from '../../ShaderDefinition';

export const noiseDistortionShader: ShaderDefinition = {
  id: 'noise-distortion',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_distortion', type: 'float' },
    { name: 'u_scale', type: 'float' },
    { name: 'u_roughness', type: 'float' },
    { name: 'u_octaves', type: 'int' },
    { name: 'u_seed', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float dist = u_distortion / 100.0 * 0.2;
  vec2 noiseCoord = uv * u_scale + float(u_seed) * 13.7;

  float dx = fbm(noiseCoord, u_octaves, u_roughness);
  float dy = fbm(noiseCoord + vec2(31.0, 17.0), u_octaves, u_roughness);

  vec2 displaced = uv + vec2(dx, dy) * dist;
  return texture(u_input0, displaced);
}`,
};

export const refractionShader: ShaderDefinition = {
  id: 'refraction',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_refraction', type: 'float' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  // Use height map if connected, otherwise use source luminance as height
  vec4 height = (u_inputCount > 1) ? texture(u_input1, uv) : texture(u_input0, uv);
  float h = luminance(height.rgb);
  vec2 texel = 1.0 / u_resolution;

  // Compute gradient of height map
  vec4 hxSample = (u_inputCount > 1)
    ? texture(u_input1, uv + vec2(texel.x, 0.0))
    : texture(u_input0, uv + vec2(texel.x, 0.0));
  vec4 hySample = (u_inputCount > 1)
    ? texture(u_input1, uv + vec2(0.0, texel.y))
    : texture(u_input0, uv + vec2(0.0, texel.y));
  float hx = luminance(hxSample.rgb) - h;
  float hy = luminance(hySample.rgb) - h;

  float refract = u_refraction / 100.0;
  vec2 displaced = uv + vec2(hx, hy) * refract;
  return texture(u_input0, displaced);
}`,
};

export const medianShader: ShaderDefinition = {
  id: 'median',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 texel = 1.0 / u_resolution;
  int r = int(u_radius);
  if (r < 1) return texture(u_input0, uv);

  // Proper 3x3 median via sorting network
  vec3 s[9];
  int idx = 0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      s[idx] = texture(u_input0, uv + vec2(float(x), float(y)) * texel * float(r)).rgb;
      idx++;
    }
  }

  // Sorting network for 9 elements (finds median)
  #define SWAP(a, b) { vec3 t = min(s[a], s[b]); s[b] = max(s[a], s[b]); s[a] = t; }
  SWAP(0,1); SWAP(3,4); SWAP(6,7);
  SWAP(1,2); SWAP(4,5); SWAP(7,8);
  SWAP(0,1); SWAP(3,4); SWAP(6,7);
  SWAP(0,3); SWAP(3,6); SWAP(0,3);
  SWAP(1,4); SWAP(4,7); SWAP(1,4);
  SWAP(2,5); SWAP(5,8); SWAP(2,5);
  SWAP(1,3); SWAP(5,7);
  SWAP(2,6); SWAP(4,6); SWAP(2,4);
  SWAP(2,3); SWAP(5,6);
  SWAP(3,4); SWAP(4,5);

  float alpha = texture(u_input0, uv).a;
  return vec4(s[4], alpha); // s[4] is the median after sorting
}`,
};

export const maximumShader: ShaderDefinition = {
  id: 'maximum',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 texel = 1.0 / u_resolution;
  int r = u_radius;
  vec4 maxColor = vec4(0.0);

  for (int x = -10; x <= 10; x++) {
    if (abs(x) > r) continue;
    for (int y = -10; y <= 10; y++) {
      if (abs(y) > r) continue;
      vec4 s = texture(u_input0, uv + vec2(float(x), float(y)) * texel);
      maxColor = max(maxColor, s);
    }
  }
  return maxColor;
}`,
};

export const minimumShader: ShaderDefinition = {
  id: 'minimum',
  inputCount: 1,
  isNeighborhood: true,
  uniforms: [
    { name: 'u_radius', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 texel = 1.0 / u_resolution;
  int r = u_radius;
  vec4 minColor = vec4(1.0);

  for (int x = -10; x <= 10; x++) {
    if (abs(x) > r) continue;
    for (int y = -10; y <= 10; y++) {
      if (abs(y) > r) continue;
      vec4 s = texture(u_input0, uv + vec2(float(x), float(y)) * texel);
      minColor = min(minColor, s);
    }
  }
  minColor.a = texture(u_input0, uv).a;
  return minColor;
}`,
};

export const pixelateShaderDef: ShaderDefinition = {
  id: 'pixelate',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_pixelSize', type: 'float' },
    { name: 'u_shape', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  // pixel size as fraction of resolution
  float ps = max(u_pixelSize, 1.0);
  vec2 cellSize = vec2(ps) / u_resolution;

  // Cell center
  vec2 cell = floor(uv / cellSize);
  vec2 cellCenter = (cell + 0.5) * cellSize;

  // Sample color at cell center
  vec4 col = texture(u_input0, cellCenter);

  // Shape masking
  if (u_shape > 0) {
    vec2 local = (uv - cell * cellSize) / cellSize - 0.5; // -0.5 to 0.5
    float dist = 0.0;

    if (u_shape == 1) {
      // Circle
      dist = length(local);
    } else if (u_shape == 2) {
      // Diamond
      dist = abs(local.x) + abs(local.y);
    }

    if (dist > 0.5) {
      col = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }

  return col;
}`,
};

export const extrudeShaderDef: ShaderDefinition = {
  id: 'extrude',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_height', type: 'float' },
    { name: 'u_angle', type: 'float' },
    { name: 'u_steps', type: 'int' },
    { name: 'u_fadeMode', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float height = u_height / 100.0 * 0.15;
  float angle = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(angle), sin(angle));

  int steps = max(u_steps, 1);
  vec2 texel = 1.0 / u_resolution;

  // Start from the farthest extrusion point and layer forward
  vec4 result = vec4(0.0, 0.0, 0.0, 1.0);

  for (int i = steps; i >= 0; i--) {
    float t = float(i) / float(steps);
    vec2 offset = dir * height * t;
    vec4 sample_color = texture(u_input0, uv - offset);

    // Fade: darken extruded layers to simulate depth
    float fade = 1.0;
    if (u_fadeMode == 0) {
      // Linear darkening
      fade = 1.0 - t * 0.6;
    } else if (u_fadeMode == 1) {
      // No fade (flat)
      fade = 1.0;
    } else if (u_fadeMode == 2) {
      // Strong shadow
      fade = 1.0 - t * 0.85;
    }

    if (i > 0) {
      // Extrusion layer
      result = vec4(sample_color.rgb * fade, sample_color.a);
    } else {
      // Top face (original, always full brightness)
      result = sample_color;
    }
  }

  return result;
}`,
};
