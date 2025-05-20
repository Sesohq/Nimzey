/**
 * textureShader.ts
 * 
 * Texture overlay and procedural texture generation for WebGL.
 * Allows applying textures with various blending modes and transformations.
 */

import { GLShader, GLShaderFactory } from '../core/GLShader';

export function textureShader(): GLShader {
  const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture samplers
uniform sampler2D u_inputTexture;
uniform sampler2D u_textureOverlay;

// Texture parameters
uniform int u_blendMode; // 0: normal, 1: multiply, 2: screen, etc.
uniform float u_opacity;
uniform vec2 u_scale;
uniform vec2 u_offset;
uniform float u_rotation;
uniform bool u_useProceduralTexture;
uniform int u_proceduralType; // 0: checkerboard, 1: stripes, 2: dots, 3: noise
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform float u_textureScale;
uniform bool u_seamlessTiling;
uniform vec2 u_resolution;

// Output color
out vec4 fragColor;

// Rotation matrix
mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

// Hash function for noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Generate checkerboard pattern
vec4 checkerboard(vec2 uv) {
  uv *= u_textureScale;
  vec2 gv = floor(uv);
  float check = mod(gv.x + gv.y, 2.0);
  vec3 color = mix(u_color1, u_color2, check);
  return vec4(color, 1.0);
}

// Generate stripe pattern
vec4 stripes(vec2 uv) {
  uv *= u_textureScale;
  float stripe = step(0.5, fract(uv.x));
  vec3 color = mix(u_color1, u_color2, stripe);
  return vec4(color, 1.0);
}

// Generate dot pattern
vec4 dots(vec2 uv) {
  uv *= u_textureScale;
  vec2 gv = fract(uv) - 0.5;
  float d = smoothstep(0.25, 0.2, length(gv));
  vec3 color = mix(u_color2, u_color1, d);
  return vec4(color, 1.0);
}

// Generate noise pattern
vec4 noisePattern(vec2 uv) {
  uv *= u_textureScale;
  float n = hash(uv);
  vec3 color = mix(u_color1, u_color2, n);
  return vec4(color, 1.0);
}

// Generate procedural texture
vec4 proceduralTexture(vec2 uv) {
  if (u_proceduralType == 0) {
    return checkerboard(uv);
  } else if (u_proceduralType == 1) {
    return stripes(uv);
  } else if (u_proceduralType == 2) {
    return dots(uv);
  } else {
    return noisePattern(uv);
  }
}

// Blend functions
vec4 blendNormal(vec4 base, vec4 blend) {
  return blend;
}

vec4 blendMultiply(vec4 base, vec4 blend) {
  return base * blend;
}

vec4 blendScreen(vec4 base, vec4 blend) {
  return vec4(1.0) - (vec4(1.0) - base) * (vec4(1.0) - blend);
}

vec4 blendOverlay(vec4 base, vec4 blend) {
  vec4 result;
  for (int i = 0; i < 3; i++) {
    if (base[i] < 0.5) {
      result[i] = 2.0 * base[i] * blend[i];
    } else {
      result[i] = 1.0 - 2.0 * (1.0 - base[i]) * (1.0 - blend[i]);
    }
  }
  result.a = base.a;
  return result;
}

vec4 blendDarken(vec4 base, vec4 blend) {
  return vec4(min(base.rgb, blend.rgb), base.a);
}

vec4 blendLighten(vec4 base, vec4 blend) {
  return vec4(max(base.rgb, blend.rgb), base.a);
}

// Transform texture coordinates for overlay
vec2 transformCoordinates(vec2 uv) {
  // Translate to center, rotate, scale, then translate back
  vec2 centered = uv - 0.5;
  centered = rotate2d(u_rotation) * centered;
  centered = centered / u_scale;
  vec2 transformed = centered + 0.5 + u_offset;
  
  // Handle seamless tiling if enabled
  if (u_seamlessTiling) {
    return fract(transformed);
  }
  return transformed;
}

void main() {
  // Sample base texture
  vec4 baseColor = texture(u_inputTexture, v_texCoord);
  
  // Get overlay texture (either from sampler or procedural)
  vec4 overlayColor;
  
  if (u_useProceduralTexture) {
    // Generate procedural texture
    overlayColor = proceduralTexture(transformCoordinates(v_texCoord));
  } else {
    // Sample from overlay texture with transformed coordinates
    vec2 transformedCoords = transformCoordinates(v_texCoord);
    
    // Check if transformed coordinates are out of bounds
    if (transformedCoords.x < 0.0 || transformedCoords.x > 1.0 || 
        transformedCoords.y < 0.0 || transformedCoords.y > 1.0) {
      // Out of bounds - handle based on seamless tiling flag
      if (u_seamlessTiling) {
        overlayColor = texture(u_textureOverlay, fract(transformedCoords));
      } else {
        // Set overlay to transparent if out of bounds
        overlayColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
    } else {
      // Sample overlay texture
      overlayColor = texture(u_textureOverlay, transformedCoords);
    }
  }
  
  // Apply selected blend mode
  vec4 blendedColor;
  
  switch (u_blendMode) {
    case 0: // Normal
      blendedColor = blendNormal(baseColor, overlayColor);
      break;
    case 1: // Multiply
      blendedColor = blendMultiply(baseColor, overlayColor);
      break;
    case 2: // Screen
      blendedColor = blendScreen(baseColor, overlayColor);
      break;
    case 3: // Overlay
      blendedColor = blendOverlay(baseColor, overlayColor);
      break;
    case 4: // Darken
      blendedColor = blendDarken(baseColor, overlayColor);
      break;
    case 5: // Lighten
      blendedColor = blendLighten(baseColor, overlayColor);
      break;
    default: // Normal
      blendedColor = blendNormal(baseColor, overlayColor);
      break;
  }
  
  // Apply opacity
  fragColor = mix(baseColor, blendedColor, overlayColor.a * u_opacity);
}
`;

  const shader = new GLShader('texture', fragmentSource, 'Applies texture overlays and procedural patterns');
  
  // Add parameters
  shader.addParameter({
    name: 'blendMode',
    type: 'int',
    defaultValue: 0,
    min: 0,
    max: 5,
    step: 1,
    description: 'Blend mode (0: Normal, 1: Multiply, 2: Screen, 3: Overlay, 4: Darken, 5: Lighten)'
  });
  
  shader.addParameter({
    name: 'opacity',
    type: 'float',
    defaultValue: 1.0,
    min: 0.0,
    max: 1.0,
    step: 0.05,
    description: 'Texture overlay opacity'
  });
  
  shader.addParameter({
    name: 'scale',
    type: 'vec2',
    defaultValue: [1.0, 1.0],
    description: 'Texture scale factor'
  });
  
  shader.addParameter({
    name: 'offset',
    type: 'vec2',
    defaultValue: [0.0, 0.0],
    description: 'Texture position offset'
  });
  
  shader.addParameter({
    name: 'rotation',
    type: 'float',
    defaultValue: 0.0,
    min: 0.0,
    max: 6.28318, // 2*PI
    step: 0.1,
    description: 'Texture rotation angle (radians)'
  });
  
  shader.addParameter({
    name: 'useProceduralTexture',
    type: 'bool',
    defaultValue: false,
    description: 'Use procedural texture instead of image'
  });
  
  shader.addParameter({
    name: 'proceduralType',
    type: 'int',
    defaultValue: 0,
    min: 0,
    max: 3,
    step: 1,
    description: 'Procedural texture type (0: Checkerboard, 1: Stripes, 2: Dots, 3: Noise)'
  });
  
  shader.addParameter({
    name: 'color1',
    type: 'vec3',
    defaultValue: [1.0, 1.0, 1.0],
    description: 'First color for procedural texture'
  });
  
  shader.addParameter({
    name: 'color2',
    type: 'vec3',
    defaultValue: [0.0, 0.0, 0.0],
    description: 'Second color for procedural texture'
  });
  
  shader.addParameter({
    name: 'textureScale',
    type: 'float',
    defaultValue: 5.0,
    min: 1.0,
    max: 50.0,
    step: 1.0,
    description: 'Scale factor for procedural texture'
  });
  
  shader.addParameter({
    name: 'seamlessTiling',
    type: 'bool',
    defaultValue: true,
    description: 'Enable seamless tiling of texture'
  });
  
  // Add uniforms
  shader.addUniform({
    name: 'u_inputTexture',
    type: 'sampler2D',
    value: null,
    description: 'Input texture'
  });
  
  shader.addUniform({
    name: 'u_textureOverlay',
    type: 'sampler2D',
    value: null,
    description: 'Overlay texture'
  });
  
  shader.addUniform({
    name: 'u_blendMode',
    type: 'int',
    value: 0,
    description: 'Blend mode'
  });
  
  shader.addUniform({
    name: 'u_opacity',
    type: 'float',
    value: 1.0,
    description: 'Texture overlay opacity'
  });
  
  shader.addUniform({
    name: 'u_scale',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Texture scale factor'
  });
  
  shader.addUniform({
    name: 'u_offset',
    type: 'vec2',
    value: [0.0, 0.0],
    description: 'Texture position offset'
  });
  
  shader.addUniform({
    name: 'u_rotation',
    type: 'float',
    value: 0.0,
    description: 'Texture rotation angle'
  });
  
  shader.addUniform({
    name: 'u_useProceduralTexture',
    type: 'bool',
    value: false,
    description: 'Use procedural texture'
  });
  
  shader.addUniform({
    name: 'u_proceduralType',
    type: 'int',
    value: 0,
    description: 'Procedural texture type'
  });
  
  shader.addUniform({
    name: 'u_color1',
    type: 'vec3',
    value: [1.0, 1.0, 1.0],
    description: 'First color for procedural texture'
  });
  
  shader.addUniform({
    name: 'u_color2',
    type: 'vec3',
    value: [0.0, 0.0, 0.0],
    description: 'Second color for procedural texture'
  });
  
  shader.addUniform({
    name: 'u_textureScale',
    type: 'float',
    value: 5.0,
    description: 'Scale factor for procedural texture'
  });
  
  shader.addUniform({
    name: 'u_seamlessTiling',
    type: 'bool',
    value: true,
    description: 'Enable seamless tiling'
  });
  
  shader.addUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [1.0, 1.0],
    description: 'Viewport resolution'
  });
  
  return shader;
}