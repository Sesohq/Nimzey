/**
 * CanvasPreview.tsx
 * 
 * High-performance Canvas-based filter preview component that provides
 * immediate feedback when adjusting filter parameters.
 */

import React, { useRef, useEffect, useState } from 'react';
import { FilterType, FilterParam } from '@/types';

interface CanvasPreviewProps {
  imageUrl: string | null;
  filterType: FilterType;
  params: FilterParam[];
  width: number;
  height: number;
  onPreviewGenerated?: (dataUrl: string) => void;
}

const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  imageUrl,
  filterType,
  params,
  width,
  height,
  onPreviewGenerated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setIsImageLoaded(true);
      applyFilters(); // Apply filters once the image is loaded
    };
    img.onerror = () => {
      console.error('Failed to load image:', imageUrl);
      setIsImageLoaded(false);
    };
    img.src = imageUrl;

    return () => {
      // Clean up
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // Apply filters when params change
  useEffect(() => {
    if (isImageLoaded) {
      applyFilters();
    }
  }, [params, isImageLoaded, filterType]);

  // Main filter application function
  const applyFilters = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas dimensions to maintain aspect ratio
    const imgAspect = img.width / img.height;
    let canvasWidth = width;
    let canvasHeight = height;
    
    if (width / height > imgAspect) {
      // Canvas is wider than image
      canvasWidth = height * imgAspect;
    } else {
      // Canvas is taller than image
      canvasHeight = width / imgAspect;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw the original image
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;

    // Apply the appropriate filter based on type
    switch (filterType) {
      case 'blur':
        applyBlurFilter(data, canvasWidth, canvasHeight, params);
        break;
      case 'sharpen':
        applySharpenFilter(data, canvasWidth, canvasHeight, params);
        break;
      case 'grayscale':
        applyGrayscaleFilter(data, params);
        break;
      case 'invert':
        applyInvertFilter(data, params);
        break;
      case 'brightness':
        applyBrightnessFilter(data, params);
        break;
      case 'contrast':
        applyContrastFilter(data, params);
        break;
      case 'noise':
        applyNoiseFilter(data, params);
        break;
      case 'dither':
        applyDitherFilter(data, canvasWidth, canvasHeight, params);
        break;
      case 'pixelate':
        applyPixelateFilter(data, canvasWidth, canvasHeight, params);
        break;
      // Add other filters as needed
    }

    // Put the processed data back to canvas
    ctx.putImageData(imageData, 0, 0);

    // Notify parent component if needed
    if (onPreviewGenerated) {
      onPreviewGenerated(canvas.toDataURL('image/png'));
    }
  };

  // Filter implementations
  const applyBrightnessFilter = (data: Uint8ClampedArray, params: FilterParam[]) => {
    const brightnessParam = params.find(p => p.name === 'brightness');
    if (!brightnessParam) return;
    
    const brightness = Number(brightnessParam.value);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + brightness));         // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness)); // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness)); // B
    }
  };

  const applyContrastFilter = (data: Uint8ClampedArray, params: FilterParam[]) => {
    const contrastParam = params.find(p => p.name === 'contrast');
    if (!contrastParam) return;
    
    const contrast = Number(contrastParam.value);
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));         // R
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // G
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // B
    }
  };

  const applyGrayscaleFilter = (data: Uint8ClampedArray, params: FilterParam[]) => {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      data[i] = avg;     // R
      data[i + 1] = avg; // G
      data[i + 2] = avg; // B
    }
  };

  const applyInvertFilter = (data: Uint8ClampedArray, params: FilterParam[]) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];         // R
      data[i + 1] = 255 - data[i + 1]; // G
      data[i + 2] = 255 - data[i + 2]; // B
    }
  };

  const applyBlurFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    const radiusParam = params.find(p => p.name === 'radius');
    if (!radiusParam) return;
    
    const radius = Math.min(Math.max(Number(radiusParam.value), 0), 50);
    if (radius <= 0) return;
    
    // Simple box blur implementation (for demonstration)
    // In a production environment, you'd use a more efficient Gaussian blur
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    const boxSize = Math.floor(radius);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let ky = -boxSize; ky <= boxSize; ky++) {
          const yy = y + ky;
          if (yy < 0 || yy >= height) continue;
          
          for (let kx = -boxSize; kx <= boxSize; kx++) {
            const xx = x + kx;
            if (xx < 0 || xx >= width) continue;
            
            const i = (yy * width + xx) * 4;
            r += tempData[i];
            g += tempData[i + 1];
            b += tempData[i + 2];
            count++;
          }
        }
        
        const i = (y * width + x) * 4;
        data[i] = r / count;
        data[i + 1] = g / count;
        data[i + 2] = b / count;
      }
    }
  };

  const applySharpenFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    const amountParam = params.find(p => p.name === 'amount');
    if (!amountParam) return;
    
    const amount = Number(amountParam.value) / 100; // Normalize to 0-1
    
    // Simple sharpening kernel
    const kernel = [
      0, -amount, 0,
      -amount, 1 + 4 * amount, -amount,
      0, -amount, 0
    ];
    
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Apply convolution
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const i = ((y + ky) * width + (x + kx)) * 4;
            const k = (ky + 1) * 3 + (kx + 1);
            
            r += tempData[i] * kernel[k];
            g += tempData[i + 1] * kernel[k];
            b += tempData[i + 2] * kernel[k];
          }
        }
        
        const i = (y * width + x) * 4;
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }
    }
  };

  const applyNoiseFilter = (data: Uint8ClampedArray, params: FilterParam[]) => {
    const amountParam = params.find(p => p.name === 'amount');
    if (!amountParam) return;
    
    const amount = Number(amountParam.value) / 100; // Normalize to 0-1
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * amount * 255;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));         // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
    }
  };

  const applyDitherFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    // Find the threshold parameter
    const thresholdParam = params.find(p => p.name === 'threshold');
    const threshold = thresholdParam ? Number(thresholdParam.value) / 100 : 0.5;
    
    // Convert to grayscale first
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const value = avg > threshold ? 255 : 0;
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
    }
  };

  const applyPixelateFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    const sizeParam = params.find(p => p.name === 'size');
    if (!sizeParam) return;
    
    const pixelSize = Math.max(1, Number(sizeParam.value));
    
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        let r = 0, g = 0, b = 0, count = 0;
        
        // Calculate average color for this pixel block
        for (let py = 0; py < pixelSize && y + py < height; py++) {
          for (let px = 0; px < pixelSize && x + px < width; px++) {
            const i = ((y + py) * width + (x + px)) * 4;
            r += tempData[i];
            g += tempData[i + 1];
            b += tempData[i + 2];
            count++;
          }
        }
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        // Apply the color to the entire pixel block
        for (let py = 0; py < pixelSize && y + py < height; py++) {
          for (let px = 0; px < pixelSize && x + px < width; px++) {
            const i = ((y + py) * width + (x + px)) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
      style={{ display: isImageLoaded ? 'block' : 'none' }}
    />
  );
};

export default CanvasPreview;