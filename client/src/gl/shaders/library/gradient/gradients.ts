import { ShaderDefinition } from '../../ShaderDefinition';

export const threeColorGradientShader: ShaderDefinition = {
  id: 'gradient-3-color',
  inputCount: 3,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_color1', type: 'vec3' }, { name: 'u_color2', type: 'vec3' }, { name: 'u_color3', type: 'vec3' },
    { name: 'u_pos1', type: 'float' }, { name: 'u_pos2', type: 'float' }, { name: 'u_pos3', type: 'float' },
    { name: 'u_angle', type: 'float' }, { name: 'u_repeat', type: 'int' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(rad), sin(rad));
  float t = dot(uv - 0.5, dir) + 0.5;
  t = fract(t * float(u_repeat));

  float p1 = u_pos1 / 100.0, p2 = u_pos2 / 100.0, p3 = u_pos3 / 100.0;
  // Use map inputs for colors if connected, otherwise use uniform colors
  vec3 c1 = (u_inputCount >= 1) ? texture(u_input0, uv).rgb : u_color1;
  vec3 c2 = (u_inputCount >= 2) ? texture(u_input1, uv).rgb : u_color2;
  vec3 c3 = (u_inputCount >= 3) ? texture(u_input2, uv).rgb : u_color3;
  vec3 color;
  if (t <= p2) {
    color = mix(c1, c2, smoothstep(p1, p2, t));
  } else {
    color = mix(c2, c3, smoothstep(p2, p3, t));
  }
  return vec4(color, 1.0);
}`,
};

export const fiveColorGradientShader: ShaderDefinition = {
  id: 'gradient-5-color',
  inputCount: 5,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_color1', type: 'vec3' }, { name: 'u_color2', type: 'vec3' }, { name: 'u_color3', type: 'vec3' },
    { name: 'u_color4', type: 'vec3' }, { name: 'u_color5', type: 'vec3' },
    { name: 'u_pos1', type: 'float' }, { name: 'u_pos2', type: 'float' }, { name: 'u_pos3', type: 'float' },
    { name: 'u_pos4', type: 'float' }, { name: 'u_pos5', type: 'float' },
    { name: 'u_angle', type: 'float' }, { name: 'u_repeat', type: 'int' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(rad), sin(rad));
  float t = dot(uv - 0.5, dir) + 0.5;
  t = fract(t * float(u_repeat));

  float p1 = u_pos1/100.0, p2 = u_pos2/100.0, p3 = u_pos3/100.0, p4 = u_pos4/100.0, p5 = u_pos5/100.0;
  // Use map inputs for colors if connected, otherwise use uniform colors
  vec3 c1 = (u_inputCount >= 1) ? texture(u_input0, uv).rgb : u_color1;
  vec3 c2 = (u_inputCount >= 2) ? texture(u_input1, uv).rgb : u_color2;
  vec3 c3 = (u_inputCount >= 3) ? texture(u_input2, uv).rgb : u_color3;
  vec3 c4 = (u_inputCount >= 4) ? texture(u_input3, uv).rgb : u_color4;
  vec3 c5 = (u_inputCount >= 5) ? texture(u_input4, uv).rgb : u_color5;
  vec3 color;
  if (t <= p2) color = mix(c1, c2, smoothstep(p1, p2, t));
  else if (t <= p3) color = mix(c2, c3, smoothstep(p2, p3, t));
  else if (t <= p4) color = mix(c3, c4, smoothstep(p3, p4, t));
  else color = mix(c4, c5, smoothstep(p4, p5, t));
  return vec4(color, 1.0);
}`,
};

export const profileGradientShader: ShaderDefinition = {
  id: 'gradient-profile',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_color1', type: 'vec3' }, { name: 'u_color2', type: 'vec3' },
    { name: 'u_offset', type: 'float' }, { name: 'u_angle', type: 'float' },
    { name: 'u_repeat', type: 'int' }, { name: 'u_mirror', type: 'bool' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(rad), sin(rad));
  float t = dot(uv - 0.5, dir) + 0.5;
  t += u_offset / 100.0;
  t = fract(t * float(u_repeat));
  if (u_mirror == 1) t = 1.0 - abs(2.0 * t - 1.0);
  t = smoothstep(0.0, 1.0, t);
  // Use map inputs for colors if connected, otherwise use uniform colors
  vec3 c1 = (u_inputCount >= 1) ? texture(u_input0, uv).rgb : u_color1;
  vec3 c2 = (u_inputCount >= 2) ? texture(u_input1, uv).rgb : u_color2;
  vec3 color = mix(c1, c2, t);
  return vec4(color, 1.0);
}`,
};

export const freeGradientShader: ShaderDefinition = {
  id: 'gradient-free',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_color1', type: 'vec3' }, { name: 'u_color2', type: 'vec3' },
    { name: 'u_type', type: 'int' },
    { name: 'u_startX', type: 'float' }, { name: 'u_startY', type: 'float' },
    { name: 'u_endX', type: 'float' }, { name: 'u_endY', type: 'float' },
    { name: 'u_continuation', type: 'int' },
    { name: 'u_inputCount', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 start = vec2(u_startX, u_startY);
  vec2 end = vec2(u_endX, u_endY);
  float t;

  if (u_type == 0) { // Linear
    vec2 dir = end - start;
    float len = length(dir);
    if (len < 0.001) {
      vec3 c1 = (u_inputCount >= 1) ? texture(u_input0, uv).rgb : u_color1;
      return vec4(c1, 1.0);
    }
    t = dot(uv - start, dir) / (len * len);
  } else if (u_type == 1) { // Radial
    float maxDist = length(end - start);
    if (maxDist < 0.001) {
      vec3 c1 = (u_inputCount >= 1) ? texture(u_input0, uv).rgb : u_color1;
      return vec4(c1, 1.0);
    }
    t = length(uv - start) / maxDist;
  } else { // Angular
    vec2 d = uv - start;
    t = atan(d.y, d.x) / 6.28318530 + 0.5;
  }

  // Continuation modes
  if (u_continuation == 0) t = clamp(t, 0.0, 1.0); // Flat
  else if (u_continuation == 1) t = fract(t); // Repeat
  else if (u_continuation == 2) t = 1.0 - abs(fract(t * 0.5) * 2.0 - 1.0); // Mirror
  else t = fract(t); // Relative Repeat

  // Use map inputs for colors if connected, otherwise use uniform colors
  vec3 c1 = (u_inputCount >= 1) ? texture(u_input0, uv).rgb : u_color1;
  vec3 c2 = (u_inputCount >= 2) ? texture(u_input1, uv).rgb : u_color2;
  vec3 color = mix(c1, c2, t);
  return vec4(color, 1.0);
}`,
};

export const elevationGradientShader: ShaderDefinition = {
  id: 'gradient-elevation',
  inputCount: 2,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_flip', type: 'bool' },
    { name: 'u_repeat', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  // Pass through elevation input as grayscale when gradient isn't connected
  if (u_inputCount < 2) return texture(u_input0, uv);
  float elev = luminance(texture(u_input0, uv).rgb);
  if (u_flip == 1) elev = 1.0 - elev;
  float t = fract(elev * float(u_repeat));
  return texture(u_input1, vec2(t, 0.5));
}`,
};

export const spectrumShader: ShaderDefinition = {
  id: 'spectrum',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_angle', type: 'float' },
    { name: 'u_repeat', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(rad), sin(rad));
  float t = dot(uv - 0.5, dir) + 0.5;
  t = fract(t * float(u_repeat));
  // Full spectrum via HSL (hue sweep, full saturation, 50% lightness)
  vec3 color = hsl2rgb(vec3(t, 1.0, 0.5));
  return vec4(color, 1.0);
}`,
};
