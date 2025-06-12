import { FilterCategory } from '@/types';

export const filterCategories: Record<string, FilterCategory> = {
  utility: {
    name: 'Utility',
    filters: [
      {
        name: 'Image',
        type: 'image',
        params: [
          {
            id: 'image-data',
            name: 'imageData',
            label: 'Image Data',
            controlType: 'select',
            paramType: 'image',
            value: ''
          }
        ]
      }
    ]
  },
  generators: {
    name: 'Generators',
    filters: [
      {
        name: 'Perlin Noise',
        type: 'perlinNoise',
        params: [
          {
            id: 'perlin-width',
            name: 'width',
            label: 'Width',
            controlType: 'range',
            paramType: 'integer',
            min: 64,
            max: 2048,
            step: 64,
            value: 512,
            unit: 'px'
          },
          {
            id: 'perlin-height',
            name: 'height',
            label: 'Height',
            controlType: 'range',
            paramType: 'integer',
            min: 64,
            max: 2048,
            step: 64,
            value: 512,
            unit: 'px'
          },
          {
            id: 'perlin-scale',
            name: 'scale',
            label: 'Scale',
            controlType: 'range',
            paramType: 'float',
            min: 0.1,
            max: 20.0,
            step: 0.1,
            value: 4.0,
            unit: ''
          },
          {
            id: 'perlin-seed',
            name: 'seed',
            label: 'Seed',
            controlType: 'range',
            paramType: 'float',
            min: 0.0,
            max: 100.0,
            step: 0.1,
            value: 1.0,
            unit: ''
          },
          {
            id: 'perlin-octaves',
            name: 'octaves',
            label: 'Octaves',
            controlType: 'range',
            paramType: 'integer',
            min: 1,
            max: 8,
            step: 1,
            value: 4,
            unit: ''
          },
          {
            id: 'perlin-persistence',
            name: 'persistence',
            label: 'Persistence',
            controlType: 'range',
            paramType: 'float',
            min: 0.1,
            max: 1.0,
            step: 0.01,
            value: 0.5,
            unit: ''
          }
        ]
      },
      {
        name: 'Checkerboard',
        type: 'checkerboard',
        params: [
          {
            id: 'checker-width',
            name: 'width',
            label: 'Width',
            controlType: 'range',
            paramType: 'integer',
            min: 64,
            max: 2048,
            step: 64,
            value: 512,
            unit: 'px'
          },
          {
            id: 'checker-height',
            name: 'height',
            label: 'Height',
            controlType: 'range',
            paramType: 'integer',
            min: 64,
            max: 2048,
            step: 64,
            value: 512,
            unit: 'px'
          },
          {
            id: 'checker-repeatH',
            name: 'repeatH',
            label: 'Repeat H',
            controlType: 'range',
            paramType: 'integer',
            min: 1,
            max: 32,
            step: 1,
            value: 8,
            unit: ''
          },
          {
            id: 'checker-repeatV',
            name: 'repeatV',
            label: 'Repeat V',
            controlType: 'range',
            paramType: 'integer',
            min: 1,
            max: 32,
            step: 1,
            value: 8,
            unit: ''
          },
          {
            id: 'checker-color1',
            name: 'color1',
            label: 'Color 1',
            controlType: 'color',
            paramType: 'color',
            value: '#ffffff'
          },
          {
            id: 'checker-color2',
            name: 'color2',
            label: 'Color 2',
            controlType: 'color',
            paramType: 'color',
            value: '#000000'
          }
        ]
      }
    ]
  },
  basic: {
    name: 'Basic Filters',
    filters: [
      {
        name: 'Blur',
        type: 'blur',
        params: [
          {
            id: 'blur-radius',
            name: 'radius',
            label: 'Radius',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            id: 'blur-quality',
            name: 'quality',
            label: 'Quality',
            controlType: 'select',
            paramType: 'option',
            options: ['Low', 'Medium', 'High'],
            value: 'Medium'
          }
        ]
      },
      {
        name: 'Sharpen',
        type: 'sharpen',
        params: [
          {
            id: 'sharpen-amount',
            name: 'amount',
            label: 'Amount',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            unit: '%'
          }
        ]
      },
      {
        name: 'Grayscale',
        type: 'grayscale',
        params: [
          {
            id: 'grayscale-strength',
            name: 'strength',
            label: 'Strength',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 100,
            step: 1,
            value: 100,
            unit: '%'
          }
        ]
      },
      {
        name: 'Invert',
        type: 'invert',
        params: []
      },
      {
        name: 'Find Edges',
        type: 'findEdges',
        params: [
          {
            id: 'findEdges-method',
            name: 'method',
            label: 'Method',
            controlType: 'select',
            paramType: 'option',
            options: ['Sobel', 'Laplacian', 'Prewitt', 'Canny'],
            value: 'Sobel'
          },
          {
            id: 'findEdges-strength',
            name: 'strength',
            label: 'Strength',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            unit: '%'
          },
          {
            id: 'findEdges-threshold',
            name: 'threshold',
            label: 'Threshold',
            controlType: 'range',
            paramType: 'integer',
            min: 0,
            max: 255,
            step: 1,
            value: 25,
            unit: ''
          },
          {
            id: 'findEdges-invert',
            name: 'invert',
            label: 'Invert',
            controlType: 'select',
            paramType: 'option',
            options: ['On', 'Off'],
            value: 'On'
          },
          {
            id: 'findEdges-preserveColor',
            name: 'preserveColor',
            label: 'Preserve Color',
            controlType: 'select',
            paramType: 'option',
            options: ['On', 'Off'],
            value: 'Off'
          }
        ]
      }
    ]
  },
  texture: {
    name: 'Texture Filters',
    filters: [
      {
        name: 'Noise',
        type: 'noise',
        params: [
          {
            id: 'noise-amount',
            name: 'amount',
            label: 'Amount',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 100,
            step: 1,
            value: 25,
            unit: '%'
          },
          {
            id: 'noise-type',
            name: 'type',
            label: 'Type',
            controlType: 'select',
            paramType: 'option',
            options: ['Gaussian', 'Uniform', 'Salt & Pepper'],
            value: 'Uniform'
          }
        ]
      },
      {
        name: 'Dither',
        type: 'dither',
        params: [
          {
            id: 'dither-type',
            name: 'ditherType',
            label: 'Dither Type',
            controlType: 'select',
            paramType: 'option',
            options: [
              'Floyd-Steinberg', 
              'Sierra Lite', 
              'Stucki Sharp', 
              'Burkes Flow', 
              'Stevenson-Arce', 
              'Fan Spread Pro', 
              'Atkinson', 
              'Jarvis',
              'Bayer 4x4', 
              'Bayer 8x8', 
              'Blue Noise'
            ],
            value: 'Floyd-Steinberg'
          },
          {
            id: 'dither-size',
            name: 'size',
            label: 'Dither Size',
            controlType: 'range',
            paramType: 'float',
            min: 1,
            max: 10,
            step: 0.5,
            value: 5,
            unit: ''
          },
          {
            id: 'dither-brightness',
            name: 'brightness',
            label: 'Brightness',
            controlType: 'range',
            paramType: 'float',
            min: -100,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            id: 'dither-contrast',
            name: 'contrast',
            label: 'Contrast',
            controlType: 'range',
            paramType: 'float',
            min: -100,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            id: 'dither-threshold',
            name: 'threshold',
            label: 'Threshold',
            controlType: 'range',
            paramType: 'integer',
            min: 0,
            max: 255,
            step: 1,
            value: 128,
            unit: ''
          },
          {
            id: 'dither-noise',
            name: 'noise',
            label: 'Noise',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            id: 'dither-grayscale',
            name: 'useGrayscale',
            label: 'Grayscale',
            controlType: 'select',
            paramType: 'boolean',
            options: ['On', 'Off'],
            value: 'On'
          },
          {
            id: 'dither-gradient',
            name: 'applyGradient',
            label: 'Apply Gradient',
            controlType: 'select',
            paramType: 'boolean',
            options: ['On', 'Off'],
            value: 'Off'
          }
        ]
      },
      {
        name: 'Texture',
        type: 'texture',
        params: [
          {
            id: 'texture-intensity',
            name: 'intensity',
            label: 'Intensity',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 100,
            step: 1,
            value: 30,
            unit: '%'
          },
          {
            id: 'texture-pattern',
            name: 'pattern',
            label: 'Pattern',
            controlType: 'select',
            paramType: 'option',
            options: ['Noise', 'Grain', 'Canvas'],
            value: 'Grain'
          }
        ]
      }
    ]
  },
  distortion: {
    name: 'Distortion Filters',
    filters: [
      {
        name: 'Extrude',
        type: 'extrude',
        params: [
          {
            id: 'extrude-blockSize',
            name: 'blockSize',
            label: 'Block Size',
            controlType: 'range',
            paramType: 'integer',
            min: 2,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            id: 'extrude-depth',
            name: 'depth',
            label: 'Extrude Depth',
            controlType: 'range',
            paramType: 'float',
            min: 1,
            max: 100,
            step: 1,
            value: 20,
            unit: 'px'
          },
          {
            id: 'extrude-shape',
            name: 'shape',
            label: 'Shape',
            controlType: 'select',
            paramType: 'option',
            options: ['Cube', 'Pyramid', 'Bevel'],
            value: 'Cube'
          },
          {
            id: 'extrude-lightDirection',
            name: 'lightDirection',
            label: 'Light Direction',
            controlType: 'select',
            paramType: 'option',
            options: ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'],
            value: 'Top-Left'
          },
          {
            id: 'extrude-materialColor',
            name: 'materialColor',
            label: 'Material Color',
            controlType: 'select',
            paramType: 'color',
            options: ['Original', 'Grayscale', 'Blue', 'Red', 'Green'],
            value: 'Original'
          },
          {
            id: 'extrude-blendOriginal',
            name: 'blendOriginal',
            label: 'Blend with Original',
            controlType: 'select',
            paramType: 'boolean',
            options: ['On', 'Off'],
            value: 'Off'
          }
        ]
      },
      {
        name: 'Wave',
        type: 'wave',
        params: [
          {
            id: 'wave-amplitude',
            name: 'amplitude',
            label: 'Amplitude',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            id: 'wave-frequency',
            name: 'frequency',
            label: 'Frequency',
            controlType: 'range',
            paramType: 'float',
            min: 1,
            max: 20,
            step: 1,
            value: 5
          }
        ]
      },
      {
        name: 'Pixelate',
        type: 'pixelate',
        params: [
          {
            id: 'pixelate-size',
            name: 'pixelSize',
            label: 'Pixel Size',
            controlType: 'range',
            paramType: 'integer',
            min: 2,
            max: 50,
            step: 1,
            value: 8,
            unit: 'px'
          }
        ]
      }
    ]
  },
  blenders: {
    name: 'Blenders',
    filters: [
      {
        name: 'Mask',
        type: 'mask',
        params: [
          {
            id: 'mask-source',
            name: 'source',
            label: 'Source',
            controlType: 'select',
            paramType: 'image',
            value: ''
          },
          {
            id: 'mask-mask',
            name: 'mask',
            label: 'Mask',
            controlType: 'select',
            paramType: 'image',
            value: ''
          },
          {
            id: 'mask-lumaMode',
            name: 'lumaMode',
            label: 'Luma Mode',
            controlType: 'checkbox',
            paramType: 'boolean',
            value: false
          }
        ]
      }
    ]
  },
  effect: {
    name: 'Effects',
    filters: [
      {
        name: 'Highlight Glow',
        type: 'glow',
        params: [
          {
            id: 'glow-radius',
            name: 'radius',
            label: 'Blur Radius',
            controlType: 'range',
            paramType: 'float',
            min: 1,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            id: 'glow-threshold',
            name: 'threshold',
            label: 'Highlight Range',
            controlType: 'range',
            paramType: 'integer',
            min: 120,
            max: 250,
            step: 1,
            value: 220,
            unit: ''
          },
          {
            id: 'glow-intensity',
            name: 'intensity',
            label: 'Glow Intensity',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 200,
            step: 1,
            value: 100,
            unit: '%'
          },
          {
            id: 'glow-blendMode',
            name: 'blendMode',
            label: 'Blend Mode',
            controlType: 'select',
            paramType: 'option',
            options: ['Screen', 'Add', 'Lighten', 'Soft Light'],
            value: 'Screen'
          },
          {
            id: 'glow-color',
            name: 'glowColor',
            label: 'Glow Color',
            controlType: 'select',
            paramType: 'color',
            options: ['Original', 'White', 'Golden', 'Blue', 'Pink'],
            value: 'Original'
          }
        ]
      },
      {
        name: 'Halftone',
        type: 'halftone',
        params: [
          {
            id: 'halftone-gridSize',
            name: 'gridSize',
            label: 'Grid Size',
            controlType: 'range',
            paramType: 'integer',
            min: 2,
            max: 30,
            step: 1,
            value: 14,
            unit: 'px'
          },
          {
            id: 'halftone-minDotSize',
            name: 'minDotSize',
            label: 'Min Dot Size',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 100,
            step: 1,
            value: 22,
            unit: '%'
          },
          {
            id: 'halftone-maxDotSize',
            name: 'maxDotSize',
            label: 'Max Dot Size',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 100,
            step: 1,
            value: 25,
            unit: '%'
          },
          {
            id: 'halftone-shape',
            name: 'shape',
            label: 'Dot Shape',
            controlType: 'select',
            paramType: 'option',
            options: ['Circle', 'Square', 'Line', 'Cross', 'Diamond'],
            value: 'Circle'
          },
          {
            id: 'halftone-angle',
            name: 'angle',
            label: 'Rotation Angle',
            controlType: 'range',
            paramType: 'float',
            min: 0,
            max: 90,
            step: 1,
            value: 0,
            unit: '°'
          },
          {
            id: 'halftone-dotColor',
            name: 'dotColor',
            label: 'Dot Color',
            controlType: 'select',
            paramType: 'color',
            options: ['Black', 'White', 'Custom'],
            value: 'Black'
          },
          {
            id: 'halftone-channelMode',
            name: 'channelMode',
            label: 'Channel Mode',
            controlType: 'select',
            paramType: 'option',
            options: ['Grayscale', 'RGB', 'CMYK'],
            value: 'Grayscale'
          }
        ]
      }
    ]
  }
};
