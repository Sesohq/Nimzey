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
  // Fall back to identity coordinates when lookup maps aren't connected
  float x = u_inputCount >= 2 ? luminance(texture(u_input1, uv).rgb) : uv.x;
  float y = u_inputCount >= 3 ? luminance(texture(u_input2, uv).rgb) : uv.y;
  return texture(u_input0, vec2(x, y));
}`,
};
