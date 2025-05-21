// Filter settings definitions
export interface FilterSetting {
  name: string;
  label: string;
  type: 'range' | 'select';
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export function getFilterSettings(filterType: string): FilterSetting[] {
  switch (filterType) {
    case 'blur':
      return [
        {
          name: 'radius',
          label: 'Radius',
          type: 'range',
          defaultValue: 5,
          min: 0,
          max: 20,
          step: 0.5
        }
      ];
    case 'noise':
      return [
        {
          name: 'amount',
          label: 'Amount',
          type: 'range',
          defaultValue: 20,
          min: 0,
          max: 100,
          step: 1
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          defaultValue: 'Perlin',
          options: ['Perlin', 'Gaussian', 'Uniform']
        }
      ];
    case 'sharpen':
      return [
        {
          name: 'amount',
          label: 'Amount',
          type: 'range',
          defaultValue: 50,
          min: 0,
          max: 100,
          step: 1
        }
      ];
    case 'grayscale':
      return [
        {
          name: 'intensity',
          label: 'Intensity',
          type: 'range',
          defaultValue: 100,
          min: 0,
          max: 100,
          step: 1
        }
      ];
    case 'invert':
      return [
        {
          name: 'intensity',
          label: 'Intensity',
          type: 'range',
          defaultValue: 100,
          min: 0,
          max: 100,
          step: 1
        }
      ];
    case 'dither':
      return [
        {
          name: 'threshold',
          label: 'Threshold',
          type: 'range',
          defaultValue: 128,
          min: 0,
          max: 255,
          step: 1
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          defaultValue: 'Floyd-Steinberg',
          options: ['Floyd-Steinberg', 'Bayer', 'Ordered']
        }
      ];
    case 'pixelate':
      return [
        {
          name: 'size',
          label: 'Pixel Size',
          type: 'range',
          defaultValue: 8,
          min: 2,
          max: 32,
          step: 1
        }
      ];
    // Add more filter types as needed
    default:
      return [];
  }
}