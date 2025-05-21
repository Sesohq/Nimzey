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
    // Add more filter types as needed
    default:
      return [];
  }
}

// Function to apply filters to images
export async function applyFilter(
  imageDataUrl: string,
  filterType: string,
  settings: Record<string, any>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Apply the appropriate filter based on type
      switch (filterType) {
        case 'blur':
          applyBlurFilter(ctx, canvas.width, canvas.height, settings);
          break;
        case 'noise':
          applyNoiseFilter(ctx, canvas.width, canvas.height, settings);
          break;
        // Add more filter implementations as needed
      }
      
      // Return the processed image as a data URL
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageDataUrl;
  });
}

// Filter implementation functions
function applyBlurFilter(ctx: CanvasRenderingContext2D, width: number, height: number, settings: Record<string, any>) {
  // Use the radius from settings, or fallback to default
  const radius = settings.radius || 5;
  
  // Apply the filter with the current setting value
  ctx.filter = `blur(${radius}px)`;
  
  // We need to draw the image again with the filter applied
  const imageData = ctx.getImageData(0, 0, width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(imageData, 0, 0);
  ctx.drawImage(ctx.canvas, 0, 0);
  
  // Reset filter for subsequent operations
  ctx.filter = 'none';
}

function applyNoiseFilter(ctx: CanvasRenderingContext2D, width: number, height: number, settings: Record<string, any>) {
  // Get settings or use defaults
  const amount = settings.amount || 20;
  const noiseType = settings.type || 'Perlin';
  
  // Get the image data to manipulate
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Simple noise implementation for demo purposes
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  
  ctx.putImageData(imageData, 0, 0);
}