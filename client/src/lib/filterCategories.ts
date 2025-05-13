import { FilterCategory } from '@/types';

export const filterCategories: Record<string, FilterCategory> = {
  basic: {
    name: 'Basic Filters',
    filters: [
      {
        name: 'Blur',
        type: 'blur',
        params: [
          {
            name: 'radius',
            label: 'Radius',
            type: 'range',
            min: 0,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            name: 'quality',
            label: 'Quality',
            type: 'select',
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
            name: 'amount',
            label: 'Amount',
            type: 'range',
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
            name: 'strength',
            label: 'Strength',
            type: 'range',
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
            name: 'method',
            label: 'Method',
            type: 'select',
            options: ['Sobel', 'Laplacian', 'Prewitt', 'Canny'],
            value: 'Sobel'
          },
          {
            name: 'strength',
            label: 'Strength',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            unit: '%'
          },
          {
            name: 'brightness',
            label: 'Brightness',
            type: 'range',
            min: -100,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            name: 'threshold',
            label: 'Threshold',
            type: 'range',
            min: 0,
            max: 255,
            step: 1,
            value: 25,
            unit: ''
          },
          {
            name: 'invert',
            label: 'Invert',
            type: 'select',
            options: ['On', 'Off'],
            value: 'On'
          },
          {
            name: 'preserveColor',
            label: 'Preserve Color',
            type: 'select',
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
            name: 'noiseType',
            label: 'Noise Type',
            type: 'select',
            options: [
              'Gaussian', 
              'Uniform', 
              'Salt & Pepper', 
              'Perlin', 
              'Simplex',
              'Fractal Perlin', 
              'Fractal Simplex'
            ],
            value: 'Perlin'
          },
          {
            name: 'amount',
            label: 'Amount',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 25,
            unit: '%'
          },
          {
            name: 'scale',
            label: 'Scale',
            type: 'range',
            min: 0.01,
            max: 1,
            step: 0.01,
            value: 0.1,
            unit: ''
          },
          {
            name: 'octaves',
            label: 'Octaves',
            type: 'range',
            min: 1,
            max: 8,
            step: 1,
            value: 4,
            unit: ''
          },
          {
            name: 'persistence',
            label: 'Persistence',
            type: 'range',
            min: 0.1,
            max: 1.0,
            step: 0.05,
            value: 0.5,
            unit: ''
          },
          {
            name: 'lacunarity',
            label: 'Lacunarity',
            type: 'range',
            min: 1.0,
            max: 3.0,
            step: 0.1,
            value: 2.0,
            unit: ''
          },
          {
            name: 'seed',
            label: 'Seed',
            type: 'range',
            min: 1,
            max: 1000,
            step: 1,
            value: 42,
            unit: ''
          },
          {
            name: 'colorize',
            label: 'Colorize',
            type: 'select',
            options: ['Off', 'Grayscale', 'Rainbow', 'Fire', 'Electric'],
            value: 'Off'
          }
        ]
      },
      {
        name: 'Dither',
        type: 'dither',
        params: [
          {
            name: 'ditherType',
            label: 'Dither Type',
            type: 'select',
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
            name: 'size',
            label: 'Dither Size',
            type: 'range',
            min: 1,
            max: 10,
            step: 0.5,
            value: 5,
            unit: ''
          },
          {
            name: 'brightness',
            label: 'Brightness',
            type: 'range',
            min: -100,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            name: 'contrast',
            label: 'Contrast',
            type: 'range',
            min: -100,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            name: 'threshold',
            label: 'Threshold',
            type: 'range',
            min: 0,
            max: 255,
            step: 1,
            value: 128,
            unit: ''
          },
          {
            name: 'noise',
            label: 'Noise',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            name: 'useGrayscale',
            label: 'Grayscale',
            type: 'select',
            options: ['On', 'Off'],
            value: 'On'
          },
          {
            name: 'applyGradient',
            label: 'Apply Gradient',
            type: 'select',
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
            name: 'intensity',
            label: 'Intensity',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 30,
            unit: '%'
          },
          {
            name: 'brightness',
            label: 'Brightness',
            type: 'range',
            min: -100,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            name: 'pattern',
            label: 'Pattern',
            type: 'select',
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
            name: 'blockSize',
            label: 'Block Size',
            type: 'range',
            min: 2,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            name: 'depth',
            label: 'Extrude Depth',
            type: 'range',
            min: 1,
            max: 100,
            step: 1,
            value: 20,
            unit: 'px'
          },
          {
            name: 'shape',
            label: 'Shape',
            type: 'select',
            options: ['Cube', 'Pyramid', 'Bevel'],
            value: 'Cube'
          },
          {
            name: 'lightDirection',
            label: 'Light Direction',
            type: 'select',
            options: ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'],
            value: 'Top-Left'
          },
          {
            name: 'materialColor',
            label: 'Material Color',
            type: 'select',
            options: ['Original', 'Grayscale', 'Blue', 'Red', 'Green'],
            value: 'Original'
          },
          {
            name: 'blendOriginal',
            label: 'Blend with Original',
            type: 'select',
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
            name: 'amplitude',
            label: 'Amplitude',
            type: 'range',
            min: 0,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            name: 'frequency',
            label: 'Frequency',
            type: 'range',
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
            name: 'pixelSize',
            label: 'Pixel Size',
            type: 'range',
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
  compositing: {
    name: 'Compositing',
    filters: [
      {
        name: 'Blend',
        type: 'blend',
        params: [
          {
            name: 'blendMode',
            label: 'Blend Mode',
            type: 'select',
            options: [
              'Normal', 
              'Multiply', 
              'Screen', 
              'Overlay', 
              'Darken',
              'Lighten',
              'Color Dodge',
              'Color Burn',
              'Hard Light',
              'Soft Light',
              'Difference',
              'Exclusion',
              'Add',
              'Subtract',
              'Divide',
              'Hue',
              'Saturation',
              'Color',
              'Luminosity'
            ],
            value: 'Normal'
          },
          {
            name: 'opacity',
            label: 'Opacity',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 100,
            unit: '%'
          },
          {
            name: 'maskType',
            label: 'Mask Type',
            type: 'select',
            options: ['None', 'Luminance', 'Alpha', 'Custom'],
            value: 'None'
          }
        ]
      },
      {
        name: 'Mask',
        type: 'mask',
        params: [
          {
            name: 'maskChannel',
            label: 'Mask Channel',
            type: 'select',
            options: ['Alpha', 'Luminance', 'Inverted'],
            value: 'Alpha'
          },
          {
            name: 'strength',
            label: 'Strength',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 100,
            unit: '%'
          },
          {
            name: 'feather',
            label: 'Feather',
            type: 'range',
            min: 0,
            max: 20,
            step: 1,
            value: 0,
            unit: 'px'
          }
        ]
      },
      {
        name: 'Multiply',
        type: 'multiply',
        params: [
          {
            name: 'strength',
            label: 'Strength',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 100,
            unit: '%'
          }
        ]
      },
      {
        name: 'Screen',
        type: 'screen',
        params: [
          {
            name: 'strength',
            label: 'Strength',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 100,
            unit: '%'
          }
        ]
      },
      {
        name: 'Mix',
        type: 'mix',
        params: [
          {
            name: 'factor',
            label: 'Mix Factor',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            unit: '%'
          },
          {
            name: 'method',
            label: 'Mix Method',
            type: 'select',
            options: ['Linear', 'Curved', 'Stepped'],
            value: 'Linear'
          }
        ]
      },
      {
        name: 'Transform',
        type: 'transform',
        params: [
          {
            name: 'translateX',
            label: 'Translate X',
            type: 'range',
            min: -100,
            max: 100,
            step: 1,
            value: 0,
            unit: 'px'
          },
          {
            name: 'translateY',
            label: 'Translate Y',
            type: 'range',
            min: -100,
            max: 100,
            step: 1,
            value: 0,
            unit: 'px'
          },
          {
            name: 'rotate',
            label: 'Rotate',
            type: 'range',
            min: -180,
            max: 180,
            step: 1,
            value: 0,
            unit: '°'
          },
          {
            name: 'scale',
            label: 'Scale',
            type: 'range',
            min: 10,
            max: 200,
            step: 1,
            value: 100,
            unit: '%'
          }
        ]
      },
      {
        name: 'Set Alpha',
        type: 'setAlpha',
        params: [
          {
            name: 'mode',
            label: 'Mode',
            type: 'select',
            options: ['Replace', 'Add', 'Subtract', 'Multiply'],
            value: 'Replace'
          },
          {
            name: 'invert',
            label: 'Invert',
            type: 'select',
            options: ['On', 'Off'],
            value: 'Off'
          }
        ]
      },
    ]
  },
  blending: {
    name: 'Blending Effects',
    filters: [
      {
        name: 'Motion Blur',
        type: 'motionBlur',
        params: [
          {
            name: 'distance',
            label: 'Distance',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 20,
            unit: 'px'
          },
          {
            name: 'angle',
            label: 'Angle',
            type: 'range',
            min: 0,
            max: 360,
            step: 1,
            value: 45,
            unit: '°'
          },
          {
            name: 'centerWeighted',
            label: 'Center Weighted',
            type: 'select',
            options: ['On', 'Off'],
            value: 'Off'
          },
          {
            name: 'blurMode',
            label: 'Blur Mode',
            type: 'select',
            options: ['Linear', 'Radial', 'Zoom'],
            value: 'Linear'
          }
        ]
      },
      {
        name: 'Noise Distortion',
        type: 'noiseDistortion',
        params: [
          {
            name: 'amplitude',
            label: 'Amplitude',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 20,
            unit: 'px'
          },
          {
            name: 'scale',
            label: 'Scale',
            type: 'range',
            min: 0.01,
            max: 1,
            step: 0.01,
            value: 0.1,
            unit: ''
          },
          {
            name: 'biasX',
            label: 'Bias X',
            type: 'range',
            min: -100,
            max: 100,
            step: 1,
            value: 100,
            unit: '%'
          },
          {
            name: 'biasY',
            label: 'Bias Y',
            type: 'range',
            min: -100,
            max: 100,
            step: 1,
            value: 100,
            unit: '%'
          },
          {
            name: 'seed',
            label: 'Seed',
            type: 'range',
            min: 1,
            max: 1000,
            step: 1,
            value: 42,
            unit: ''
          },
          {
            name: 'noiseType',
            label: 'Noise Type',
            type: 'select',
            options: ['Perlin', 'Simplex', 'Worley', 'FBM', 'Ridged'],
            value: 'Perlin'
          }
        ]
      }
    ]
  },
  effects: {
    name: 'Effects',
    filters: [
      {
        name: 'Refraction',
        type: 'refraction',
        params: [
          {
            name: 'size',
            label: 'Size',
            type: 'range',
            min: 1,
            max: 100,
            step: 1,
            value: 30,
            unit: 'px'
          },
          {
            name: 'amount',
            label: 'Refraction',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            unit: '%'
          },
          {
            name: 'heightScale',
            label: 'Height Scale',
            type: 'range',
            min: 0,
            max: 200,
            step: 1,
            value: 100,
            unit: '%'
          },
          {
            name: 'precision',
            label: 'Precision',
            type: 'select',
            options: ['Low', 'Medium', 'High'],
            value: 'Medium'
          }
        ]
      },
      {
        name: 'Highlight Glow',
        type: 'glow',
        params: [
          {
            name: 'radius',
            label: 'Blur Radius',
            type: 'range',
            min: 1,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            name: 'threshold',
            label: 'Highlight Range',
            type: 'range',
            min: 120,
            max: 250,
            step: 1,
            value: 220,
            unit: ''
          },
          {
            name: 'intensity',
            label: 'Glow Intensity',
            type: 'range',
            min: 0,
            max: 200,
            step: 1,
            value: 100,
            unit: '%'
          },
          {
            name: 'blendMode',
            label: 'Blend Mode',
            type: 'select',
            options: ['Screen', 'Add', 'Lighten', 'Soft Light'],
            value: 'Screen'
          },
          {
            name: 'glowColor',
            label: 'Glow Color',
            type: 'select',
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
            name: 'gridSize',
            label: 'Grid Size',
            type: 'range',
            min: 2,
            max: 30,
            step: 1,
            value: 8,
            unit: 'px'
          },
          {
            name: 'minDotSize',
            label: 'Min Dot Size',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 0,
            unit: '%'
          },
          {
            name: 'maxDotSize',
            label: 'Max Dot Size',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: 90,
            unit: '%'
          },
          {
            name: 'shape',
            label: 'Dot Shape',
            type: 'select',
            options: ['Circle', 'Square', 'Line', 'Cross', 'Diamond'],
            value: 'Circle'
          },
          {
            name: 'angle',
            label: 'Rotation Angle',
            type: 'range',
            min: 0,
            max: 90,
            step: 1,
            value: 0,
            unit: '°'
          },
          {
            name: 'dotColor',
            label: 'Dot Color',
            type: 'select',
            options: ['Original', 'Black', 'White', 'Custom'],
            value: 'Black'
          },
          {
            name: 'channelMode',
            label: 'Channel Mode',
            type: 'select',
            options: ['Grayscale', 'RGB', 'CMYK'],
            value: 'Grayscale'
          }
        ]
      }
    ]
  }
};
