/**
 * filterSettings.ts
 * 
 * Defines the settings UI configuration for each filter type
 */

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
          defaultValue: 10,
          min: 0,
          max: 50,
          step: 1
        },
        {
          name: 'quality',
          label: 'Quality',
          type: 'select',
          defaultValue: 'Medium',
          options: ['Low', 'Medium', 'High']
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
          name: 'strength',
          label: 'Strength',
          type: 'range',
          defaultValue: 100,
          min: 0,
          max: 100,
          step: 1
        }
      ];

    case 'noise':
      return [
        {
          name: 'amount',
          label: 'Amount',
          type: 'range',
          defaultValue: 25,
          min: 0,
          max: 100,
          step: 1
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          defaultValue: 'Uniform',
          options: ['Gaussian', 'Uniform', 'Salt & Pepper']
        }
      ];
      
    case 'pixelate':
      return [
        {
          name: 'pixelSize',
          label: 'Pixel Size',
          type: 'range',
          defaultValue: 8,
          min: 2,
          max: 50,
          step: 1
        }
      ];
      
    case 'findEdges':
      return [
        {
          name: 'strength',
          label: 'Strength',
          type: 'range',
          defaultValue: 50,
          min: 0,
          max: 100,
          step: 1
        },
        {
          name: 'threshold',
          label: 'Threshold',
          type: 'range',
          defaultValue: 25,
          min: 0,
          max: 255,
          step: 1
        },
        {
          name: 'method',
          label: 'Method',
          type: 'select',
          defaultValue: 'Sobel',
          options: ['Sobel', 'Laplacian', 'Prewitt', 'Canny']
        }
      ];
      
    case 'dither':
      return [
        {
          name: 'ditherType',
          label: 'Dither Type',
          type: 'select',
          defaultValue: 'Floyd-Steinberg',
          options: [
            'Floyd-Steinberg', 
            'Sierra Lite', 
            'Stucki Sharp', 
            'Atkinson'
          ]
        },
        {
          name: 'size',
          label: 'Dither Size',
          type: 'range',
          defaultValue: 5,
          min: 1,
          max: 10,
          step: 0.5
        },
        {
          name: 'threshold',
          label: 'Threshold',
          type: 'range',
          defaultValue: 128,
          min: 0,
          max: 255,
          step: 1
        }
      ];
      
    case 'glow':
      return [
        {
          name: 'radius',
          label: 'Blur Radius',
          type: 'range',
          defaultValue: 10,
          min: 1,
          max: 50,
          step: 1
        },
        {
          name: 'intensity',
          label: 'Glow Intensity',
          type: 'range',
          defaultValue: 100,
          min: 0,
          max: 200,
          step: 1
        },
        {
          name: 'blendMode',
          label: 'Blend Mode',
          type: 'select',
          defaultValue: 'Screen',
          options: ['Screen', 'Add', 'Lighten', 'Soft Light']
        }
      ];
      
    case 'halftone':
      return [
        {
          name: 'gridSize',
          label: 'Grid Size',
          type: 'range',
          defaultValue: 14,
          min: 2,
          max: 30,
          step: 1
        },
        {
          name: 'shape',
          label: 'Dot Shape',
          type: 'select',
          defaultValue: 'Circle',
          options: ['Circle', 'Square', 'Line', 'Cross', 'Diamond']
        }
      ];
      
    // Default empty settings if filter type is not recognized
    default:
      return [];
  }
}

// Helper function to convert filter parameters to settings object
export function paramsToSettings(params: any[]): Record<string, any> {
  const settings: Record<string, any> = {};
  
  if (Array.isArray(params)) {
    params.forEach(param => {
      if (param && typeof param === 'object' && 'name' in param && 'value' in param) {
        settings[param.name] = param.value;
      }
    });
  }
  
  return settings;
}

// Helper function to convert settings object to filter parameters
export function settingsToParams(settings: Record<string, any>, originalParams: any[]): any[] {
  if (!originalParams || !Array.isArray(originalParams)) return [];
  
  return originalParams.map(param => {
    if (typeof param === 'object' && param && 'name' in param) {
      const paramName = param.name;
      return {
        ...param,
        value: settings[paramName] !== undefined ? settings[paramName] : param.value
      };
    }
    return param;
  });
}