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
            name: 'type',
            label: 'Type',
            type: 'select',
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
            name: 'depth',
            label: 'Depth',
            type: 'range',
            min: 1,
            max: 50,
            step: 1,
            value: 10,
            unit: 'px'
          },
          {
            name: 'direction',
            label: 'Direction',
            type: 'select',
            options: ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'],
            value: 'Top-Left'
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
