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
            name: 'pattern',
            label: 'Pattern',
            type: 'select',
            options: ['Bayer 4x4', 'Bayer 8x8', 'Floyd-Steinberg'],
            value: 'Bayer 4x4'
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
  }
};
