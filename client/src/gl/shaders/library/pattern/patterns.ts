import { ShaderDefinition } from '../../ShaderDefinition';

export const checkerShader: ShaderDefinition = {
  id: 'checker',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_color1', type: 'vec3' },
    { name: 'u_color2', type: 'vec3' },
    { name: 'u_repeatH', type: 'int' },
    { name: 'u_repeatV', type: 'int' },
    { name: 'u_inclined', type: 'bool' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 p = uv;
  if (u_inclined == 1) {
    p = rot2D(0.7853981634) * (p - 0.5) + 0.5;
  }
  vec2 grid = floor(p * vec2(float(u_repeatH), float(u_repeatV)));
  float checker = mod(grid.x + grid.y, 2.0);
  vec3 color = mix(u_color1, u_color2, checker);
  return vec4(color, 1.0);
}`,
};

export const bricksShader: ShaderDefinition = {
  id: 'bricks',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_bond', type: 'int' },
    { name: 'u_brickColor', type: 'vec3' },
    { name: 'u_mortarColor', type: 'vec3' },
    { name: 'u_repeatH', type: 'int' },
    { name: 'u_repeatV', type: 'int' },
    { name: 'u_mortarWidth', type: 'float' },
    { name: 'u_bevelWidth', type: 'float' },
    { name: 'u_corners', type: 'float' },
    { name: 'u_chaos', type: 'float' },
    { name: 'u_seed', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 gridSize = vec2(float(u_repeatH), float(u_repeatV));
  vec2 p = uv * gridSize;
  float row = floor(p.y);

  // Row offset based on bond pattern
  float offset = 0.0;
  if (u_bond == 0) offset = mod(row, 2.0) * 0.5; // Running bond
  else if (u_bond == 1) offset = mod(row, 3.0) / 3.0; // Running 1/3
  else if (u_bond == 2) offset = 0.0; // Stack
  else if (u_bond == 3) offset = mod(row, 2.0) * 0.5; // English (simplified)
  else if (u_bond == 4) { // Herringbone
    float flip = mod(row, 2.0);
    offset = flip * 0.5;
  }

  p.x += offset;
  vec2 brickPos = fract(p);
  vec2 brickId = floor(p);

  // Chaos: randomize brick color slightly
  float colorVar = 0.0;
  if (u_chaos > 0.0) {
    colorVar = (hash(brickId + float(u_seed)) - 0.5) * u_chaos / 100.0;
  }

  // Mortar
  float mw = u_mortarWidth / 100.0 * 0.5;
  float bw = u_bevelWidth / 100.0 * 0.5;
  float corner = u_corners / 100.0 * mw * 2.0;

  float edgeX = min(brickPos.x, 1.0 - brickPos.x);
  float edgeY = min(brickPos.y, 1.0 - brickPos.y);

  // Rounded corners
  float edge;
  if (corner > 0.0 && edgeX < mw + corner && edgeY < mw + corner) {
    vec2 cornerDist = vec2(edgeX - mw - corner, edgeY - mw - corner);
    if (cornerDist.x < 0.0 && cornerDist.y < 0.0) {
      edge = length(max(cornerDist + corner, 0.0));
    } else {
      edge = min(edgeX, edgeY);
    }
  } else {
    edge = min(edgeX, edgeY);
  }

  float isMortar = 1.0 - smoothstep(mw - 0.005, mw + 0.005, edge);

  // Bevel
  float bevel = 0.0;
  if (bw > 0.0) {
    float bevelDist = clamp((edge - mw) / bw, 0.0, 1.0);
    bevel = 1.0 - bevelDist;
  }

  vec3 brickCol = u_brickColor + colorVar;
  vec3 brickWithBevel = mix(brickCol, brickCol * 0.7, bevel * 0.3);
  vec3 color = mix(brickWithBevel, u_mortarColor, isMortar);

  return vec4(clamp(color, 0.0, 1.0), 1.0);
}`,
};

export const tilesShader: ShaderDefinition = {
  id: 'tiles',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_tileColor', type: 'vec3' },
    { name: 'u_mortarColor', type: 'vec3' },
    { name: 'u_repeatH', type: 'int' },
    { name: 'u_repeatV', type: 'int' },
    { name: 'u_rowShift', type: 'float' },
    { name: 'u_mortarWidth', type: 'float' },
    { name: 'u_bevelWidth', type: 'float' },
    { name: 'u_corners', type: 'float' },
    { name: 'u_chaos', type: 'float' },
    { name: 'u_seed', type: 'int' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 gridSize = vec2(float(u_repeatH), float(u_repeatV));
  vec2 p = uv * gridSize;
  float row = floor(p.y);
  p.x += row * u_rowShift / 100.0;
  vec2 cellPos = fract(p);
  vec2 cellId = floor(p);

  float mw = u_mortarWidth / 100.0 * 0.5;
  float edgeX = min(cellPos.x, 1.0 - cellPos.x);
  float edgeY = min(cellPos.y, 1.0 - cellPos.y);
  float edge = min(edgeX, edgeY);

  float isMortar = 1.0 - smoothstep(mw - 0.005, mw + 0.005, edge);

  // Bevel
  float bw = u_bevelWidth / 100.0 * 0.5;
  float bevel = 0.0;
  if (bw > 0.0) {
    bevel = 1.0 - clamp((edge - mw) / bw, 0.0, 1.0);
  }

  float colorVar = 0.0;
  if (u_chaos > 0.0) {
    colorVar = (hash(cellId + float(u_seed)) - 0.5) * u_chaos / 100.0;
  }

  vec3 tileCol = u_tileColor + colorVar;
  vec3 tileWithBevel = mix(tileCol, tileCol * 0.7, bevel * 0.3);
  vec3 color = mix(tileWithBevel, u_mortarColor, isMortar);

  return vec4(clamp(color, 0.0, 1.0), 1.0);
}`,
};

export const ellipseShader: ShaderDefinition = {
  id: 'ellipse',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_color', type: 'vec3' },
    { name: 'u_background', type: 'vec3' },
    { name: 'u_radiusX', type: 'float' },
    { name: 'u_radiusY', type: 'float' },
    { name: 'u_centerX', type: 'float' },
    { name: 'u_centerY', type: 'float' },
    { name: 'u_bevelWidth', type: 'float' },
    { name: 'u_rotation', type: 'float' },
  ],
  glsl: `
vec4 processPixel(vec2 uv) {
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 p = uv - center;
  float rad = u_rotation * 3.14159265 / 180.0;
  p = rot2D(rad) * p;

  float dist = length(p / vec2(u_radiusX, u_radiusY));
  float bw = u_bevelWidth / 100.0;

  float shape;
  if (bw > 0.0) {
    shape = 1.0 - smoothstep(1.0 - bw, 1.0, dist);
  } else {
    shape = step(dist, 1.0);
  }

  vec3 color = mix(u_background, u_color, shape);
  return vec4(color, 1.0);
}`,
};

export const polygonShader: ShaderDefinition = {
  id: 'polygon',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_color', type: 'vec3' },
    { name: 'u_background', type: 'vec3' },
    { name: 'u_vertices', type: 'int' },
    { name: 'u_radius', type: 'float' },
    { name: 'u_centerX', type: 'float' },
    { name: 'u_centerY', type: 'float' },
    { name: 'u_bevelWidth', type: 'float' },
    { name: 'u_rotation', type: 'float' },
  ],
  glsl: `
float polygonSDF(vec2 p, int n, float r) {
  float a = atan(p.x, p.y) + 3.14159265;
  float seg = 6.28318530 / float(n);
  float d = cos(floor(0.5 + a / seg) * seg - a) * length(p);
  return d - r;
}

vec4 processPixel(vec2 uv) {
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 p = uv - center;
  float rad = u_rotation * 3.14159265 / 180.0;
  p = rot2D(rad) * p;

  float d = polygonSDF(p, u_vertices, u_radius);
  float bw = u_bevelWidth / 100.0 * u_radius;

  float shape;
  if (bw > 0.0) {
    shape = 1.0 - smoothstep(-bw, 0.0, d);
  } else {
    shape = 1.0 - step(0.0, d);
  }

  vec3 color = mix(u_background, u_color, shape);
  return vec4(color, 1.0);
}`,
};

export const rectangleShader: ShaderDefinition = {
  id: 'rectangle',
  inputCount: 0,
  isNeighborhood: false,
  uniforms: [
    { name: 'u_color', type: 'vec3' },
    { name: 'u_background', type: 'vec3' },
    { name: 'u_width', type: 'float' },
    { name: 'u_height', type: 'float' },
    { name: 'u_centerX', type: 'float' },
    { name: 'u_centerY', type: 'float' },
    { name: 'u_corners', type: 'float' },
    { name: 'u_bevelWidth', type: 'float' },
    { name: 'u_rotation', type: 'float' },
  ],
  glsl: `
float roundedRectSDF(vec2 p, vec2 size, float radius) {
  vec2 d = abs(p) - size + radius;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
}

vec4 processPixel(vec2 uv) {
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 p = uv - center;
  float rad = u_rotation * 3.14159265 / 180.0;
  p = rot2D(rad) * p;

  vec2 size = vec2(u_width, u_height) * 0.5;
  float cornerRadius = u_corners / 100.0 * min(size.x, size.y);
  float d = roundedRectSDF(p, size, cornerRadius);
  float bw = u_bevelWidth / 100.0 * min(size.x, size.y);

  float shape;
  if (bw > 0.0) {
    shape = 1.0 - smoothstep(-bw, 0.0, d);
  } else {
    shape = 1.0 - step(0.0, d);
  }

  vec3 color = mix(u_background, u_color, shape);
  return vec4(color, 1.0);
}`,
};
