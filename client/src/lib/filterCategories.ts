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
  effects: {
    name: 'Effects',
    filters: [
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
