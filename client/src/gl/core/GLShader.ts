/**
 * GLShader.ts
 * 
 * Base classes for shader management in the WebGL filter engine.
 * Includes classes for vertex and fragment shaders, as well as
 * utility functions for shader compilation and management.
 */

// Base vertex shader that renders a full-screen quad
export const BASE_VERTEX_SHADER = `#version 300 es
precision highp float;

// Position attribute
in vec2 a_position;

// Texture coordinates output to fragment shader
out vec2 v_texCoord;

void main() {
  // Convert from clip space (-1 to +1) to texture space (0 to 1)
  v_texCoord = a_position * 0.5 + 0.5;
  
  // Output clip-space position
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Type definitions for shader uniforms
export type ShaderUniformType = 'float' | 'int' | 'bool' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D';

// Interface for shader uniform definitions
export interface ShaderUniform {
  name: string;
  type: ShaderUniformType;
  value: number | number[] | boolean | WebGLTexture | null;
  description?: string;
}

// Interface for shader parameters that can be manipulated by UI
export interface ShaderParameter {
  name: string;
  type: ShaderUniformType;
  defaultValue: number | number[] | boolean;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

// Class that manages a single shader with its uniforms and parameters
export class GLShader {
  // Shader source code
  private vertexSource: string;
  private fragmentSource: string;
  
  // Shader metadata
  private name: string;
  private description: string;
  
  // Shader uniforms and parameters
  private uniforms: Map<string, ShaderUniform> = new Map();
  private parameters: Map<string, ShaderParameter> = new Map();
  
  constructor(name: string, fragmentSource: string, description: string = '') {
    this.name = name;
    this.vertexSource = BASE_VERTEX_SHADER;
    this.fragmentSource = fragmentSource;
    this.description = description;
  }
  
  // Add a uniform to the shader
  public addUniform(uniform: ShaderUniform): void {
    this.uniforms.set(uniform.name, uniform);
  }
  
  // Add a parameter to the shader
  public addParameter(param: ShaderParameter): void {
    this.parameters.set(param.name, param);
  }
  
  // Get the vertex shader source
  public getVertexSource(): string {
    return this.vertexSource;
  }
  
  // Get the fragment shader source
  public getFragmentSource(): string {
    return this.fragmentSource;
  }
  
  // Get the shader name
  public getName(): string {
    return this.name;
  }
  
  // Get the shader description
  public getDescription(): string {
    return this.description;
  }
  
  // Get all uniforms
  public getUniforms(): Map<string, ShaderUniform> {
    return this.uniforms;
  }
  
  // Get all parameters
  public getParameters(): Map<string, ShaderParameter> {
    return this.parameters;
  }
  
  // Get a specific uniform
  public getUniform(name: string): ShaderUniform | undefined {
    return this.uniforms.get(name);
  }
  
  // Get a specific parameter
  public getParameter(name: string): ShaderParameter | undefined {
    return this.parameters.get(name);
  }
  
  // Set a uniform value
  public setUniformValue(name: string, value: any): void {
    const uniform = this.uniforms.get(name);
    if (uniform) {
      uniform.value = value;
    }
  }
  
  // Set a parameter value which also updates the corresponding uniform
  public setParameterValue(name: string, value: any): void {
    const param = this.parameters.get(name);
    if (param) {
      // Create a uniform name from the parameter name (e.g. u_paramName)
      const uniformName = `u_${name}`;
      this.setUniformValue(uniformName, value);
    }
  }
  
  // Get the uniform values as a record
  public getUniformValues(): Record<string, any> {
    const values: Record<string, any> = {};
    const textureMap: Record<string, number> = {};
    let textureIndex = 0;
    
    this.uniforms.forEach((uniform, name) => {
      values[name] = uniform.value;
      
      // Track texture indices
      if (uniform.type === 'sampler2D' && uniform.value instanceof WebGLTexture) {
        textureMap[name] = textureIndex++;
      }
    });
    
    // Add texture map if we have textures
    if (textureIndex > 0) {
      values._textureMap = textureMap;
    }
    
    return values;
  }
}

// Factory class to create different types of shaders
export class GLShaderFactory {
  /**
   * Create a basic shader with a single input texture
   */
  public static createBasicShader(
    name: string,
    description: string,
    fragmentMain: string
  ): GLShader {
    const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Output color
out vec4 fragColor;

// Main function
void main() {
  // Sample input texture
  vec4 color = texture(u_inputTexture, v_texCoord);
  
  ${fragmentMain}
  
  // Output final color
  fragColor = color;
}
`;
  
    const shader = new GLShader(name, fragmentSource, description);
    
    // Add input texture uniform
    shader.addUniform({
      name: 'u_inputTexture',
      type: 'sampler2D',
      value: null,
      description: 'Input texture'
    });
    
    return shader;
  }
  
  /**
   * Create a multi-texture shader with parameters
   */
  public static createMultiTextureShader(
    name: string,
    description: string,
    parameters: ShaderParameter[],
    uniformDeclarations: string,
    fragmentMain: string
  ): GLShader {
    const fragmentSource = `#version 300 es
precision highp float;

// Input texture coordinates
in vec2 v_texCoord;

// Input texture sampler
uniform sampler2D u_inputTexture;

// Additional uniforms
${uniformDeclarations}

// Output color
out vec4 fragColor;

// Main function
void main() {
  // Sample input texture
  vec4 color = texture(u_inputTexture, v_texCoord);
  
  ${fragmentMain}
  
  // Output final color
  fragColor = color;
}
`;
  
    const shader = new GLShader(name, fragmentSource, description);
    
    // Add input texture uniform
    shader.addUniform({
      name: 'u_inputTexture',
      type: 'sampler2D',
      value: null,
      description: 'Input texture'
    });
    
    // Add parameters and corresponding uniforms
    parameters.forEach(param => {
      shader.addParameter(param);
      
      // Create a uniform for the parameter
      shader.addUniform({
        name: `u_${param.name}`,
        type: param.type,
        value: param.defaultValue,
        description: param.description
      });
    });
    
    return shader;
  }
}