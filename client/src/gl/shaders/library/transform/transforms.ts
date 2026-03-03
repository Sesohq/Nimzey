import { ShaderDefinition } from '../../ShaderDefinition';

export const flipShader: ShaderDefinition = {
  id: 'flip',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_horizontal', type: 'bool' },
    { name: 'u_vertical', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = uv;
  if (u_horizontal == 1) p.x = 1.0 - p.x;
  if (u_vertical == 1) p.y = 1.0 - p.y;
  return texture(u_input0, p);
}`,
};

export const rotateShader: ShaderDefinition = {
  id: 'rotate',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_rotation', type: 'float' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  float rad = u_rotation * 3.14159265 / 180.0;
  vec2 p = rot2D(-rad) * (uv - origin) + origin;

  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) {
    return vec4(0.0);
  }
  return texture(u_input0, p);
}`,
};

export const scaleShader: ShaderDefinition = {
  id: 'scale',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_scale', type: 'float' },
    { name: 'u_squash', type: 'float' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  float s = u_scale;
  if (abs(s) < 0.001) return vec4(0.0);
  float squash = u_squash / 100.0;
  vec2 scale = vec2(s * (1.0 + squash), s * (1.0 - squash));
  vec2 p = (uv - origin) / scale + origin;

  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) {
    return vec4(0.0);
  }
  return texture(u_input0, p);
}`,
};

export const offsetShader: ShaderDefinition = {
  id: 'offset',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_offsetX', type: 'float' },
    { name: 'u_offsetY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = fract(uv - vec2(u_offsetX, u_offsetY));
  return texture(u_input0, p);
}`,
};

export const perspectiveShader: ShaderDefinition = {
  id: 'perspective',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_perspective', type: 'float' },
    { name: 'u_fov', type: 'float' },
    { name: 'u_pitch', type: 'float' },
    { name: 'u_yaw', type: 'float' },
    { name: 'u_roll', type: 'float' },
    { name: 'u_mode', type: 'int' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float strength = u_perspective / 100.0;
  float fovRad = u_fov * 3.14159265 / 180.0;
  float d = 1.0 / tan(fovRad * 0.5);
  float pitchRad = u_pitch * 3.14159265 / 180.0;
  float yawRad = u_yaw * 3.14159265 / 180.0;
  float rollRad = u_roll * 3.14159265 / 180.0;

  // Center UV
  vec2 p = (uv - 0.5) * 2.0;

  // Apply roll rotation
  float cr = cos(rollRad), sr = sin(rollRad);
  p = mat2(cr, -sr, sr, cr) * p;

  // 3D perspective projection
  float z = d + strength * (p.x * sin(yawRad) + p.y * sin(pitchRad));
  if (z < 0.01) z = 0.01;
  vec2 projected = vec2(
    (p.x * cos(yawRad)) / z,
    (p.y * cos(pitchRad)) / z
  );

  // Undo roll
  projected = mat2(cr, sr, -sr, cr) * projected;

  vec2 texCoord = projected * 0.5 + 0.5;

  // Mode handling
  if (u_mode == 1) {
    texCoord = fract(texCoord); // Tiled
  } else if (u_mode == 2) {
    texCoord = abs(mod(texCoord, 2.0) - 1.0); // Infinite (mirror)
  } else {
    // Clipped
    if (texCoord.x < 0.0 || texCoord.x > 1.0 || texCoord.y < 0.0 || texCoord.y > 1.0) {
      if (u_inputCount >= 2) return texture(u_input1, uv);
      return vec4(0.0);
    }
  }
  return texture(u_input0, texCoord);
}`,
};

export const lookupShader: ShaderDefinition = {
  id: 'lookup',
  inputCount: 3,
  isNeighborhood: false,
  uniforms: [{ name: 'u_inputCount', type: 'int' }],
  glsl: `
vec4 processPixel(vec2 uv) {
  float x = u_inputCount >= 2 ? luminance(texture(u_input1, uv).rgb) : uv.x;
  float y = u_inputCount >= 3 ? luminance(texture(u_input2, uv).rgb) : uv.y;
  return texture(u_input0, vec2(x, y));
}`,
};

// ===== New Distortion Shaders =====

export const twirlShader: ShaderDefinition = {
  id: 'twirl',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_strength', type: 'float' },
    { name: 'u_radius', type: 'float' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  vec2 d = uv - origin;
  float dist = length(d);
  float r = u_radius;
  if (dist < r) {
    float t = 1.0 - dist / r;
    float angle = u_strength * t * t * 6.28318530;
    float c = cos(angle), s = sin(angle);
    d = mat2(c, -s, s, c) * d;
  }
  vec2 p = origin + d;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0);
  return texture(u_input0, p);
}`,
};

export const rippleShader: ShaderDefinition = {
  id: 'ripple',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_amplitude', type: 'float' },
    { name: 'u_frequency', type: 'float' },
    { name: 'u_phase', type: 'float' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
    { name: 'u_decay', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  vec2 d = uv - origin;
  float dist = length(d);
  if (dist < 0.0001) return texture(u_input0, uv);
  float falloff = exp(-dist * u_decay);
  float wave = sin(dist * u_frequency * 6.28318530 - u_phase * 6.28318530) * u_amplitude * falloff;
  vec2 dir = d / dist;
  vec2 p = uv + dir * wave;
  return texture(u_input0, fract(p));
}`,
};

export const polarCoordinatesShader: ShaderDefinition = {
  id: 'polar-coordinates',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_mode', type: 'int' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  vec2 p;
  if (u_mode == 0) {
    // Rectangular to Polar
    vec2 d = uv - origin;
    float r = length(d) * 2.0;
    float theta = atan(d.y, d.x) / 6.28318530 + 0.5;
    p = vec2(theta, r);
  } else {
    // Polar to Rectangular
    float theta = (uv.x - 0.5) * 6.28318530;
    float r = uv.y * 0.5;
    p = origin + vec2(cos(theta), sin(theta)) * r;
  }
  p = fract(p);
  return texture(u_input0, p);
}`,
};

export const spherizeShader: ShaderDefinition = {
  id: 'spherize',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_strength', type: 'float' },
    { name: 'u_mode', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 center = uv * 2.0 - 1.0;
  float dist = length(center);
  if (dist > 1.0) return texture(u_input0, uv);
  float str = u_strength / 100.0;
  vec2 p;
  if (u_mode == 0) {
    // Spherize (bulge out)
    float z = sqrt(1.0 - dist * dist);
    p = center / (z + (1.0 - str));
  } else {
    // Pinch (squeeze in)
    p = center * mix(1.0, dist, str);
  }
  p = p * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0);
  return texture(u_input0, p);
}`,
};

export const waveShader: ShaderDefinition = {
  id: 'wave',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_ampX', type: 'float' },
    { name: 'u_ampY', type: 'float' },
    { name: 'u_freqX', type: 'float' },
    { name: 'u_freqY', type: 'float' },
    { name: 'u_phaseX', type: 'float' },
    { name: 'u_phaseY', type: 'float' },
    { name: 'u_type', type: 'int' },
  ],
  glsl: `
float waveFunc(float t, int type) {
  if (type == 1) return abs(fract(t) * 2.0 - 1.0) * 2.0 - 1.0; // triangle
  if (type == 2) return fract(t) * 2.0 - 1.0; // sawtooth
  return sin(t * 6.28318530); // sine
}
vec4 processPixel(vec2 uv) {
  float dx = u_ampX * waveFunc(uv.y * u_freqX + u_phaseX, u_type);
  float dy = u_ampY * waveFunc(uv.x * u_freqY + u_phaseY, u_type);
  vec2 p = fract(uv + vec2(dx, dy));
  return texture(u_input0, p);
}`,
};

export const kaleidoscopeShader: ShaderDefinition = {
  id: 'kaleidoscope',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_segments', type: 'int' },
    { name: 'u_rotation', type: 'float' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  vec2 d = uv - origin;
  float angle = atan(d.y, d.x) + u_rotation * 3.14159265 / 180.0;
  float dist = length(d);
  float segAngle = 6.28318530 / float(u_segments);
  angle = mod(angle, segAngle);
  if (angle > segAngle * 0.5) angle = segAngle - angle;
  vec2 p = origin + vec2(cos(angle), sin(angle)) * dist;
  p = clamp(p, 0.0, 1.0);
  return texture(u_input0, p);
}`,
};

export const vortexShader: ShaderDefinition = {
  id: 'vortex',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_strength', type: 'float' },
    { name: 'u_originX', type: 'float' },
    { name: 'u_originY', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 origin = vec2(u_originX, u_originY);
  vec2 d = uv - origin;
  float dist = length(d);
  float angle = u_strength * dist * 6.28318530;
  float c = cos(angle), s = sin(angle);
  d = mat2(c, -s, s, c) * d;
  vec2 p = origin + d;
  p = fract(p);
  return texture(u_input0, p);
}`,
};

export const barrelDistortShader: ShaderDefinition = {
  id: 'barrel-distort',
  inputCount: 1,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_k1', type: 'float' },
    { name: 'u_k2', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 center = uv * 2.0 - 1.0;
  float r2 = dot(center, center);
  float r4 = r2 * r2;
  float distort = 1.0 + u_k1 * r2 + u_k2 * r4;
  vec2 p = center * distort * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0);
  return texture(u_input0, p);
}`,
};
