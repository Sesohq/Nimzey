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
      case 'noise':
        applyNoiseFilter(data, params);
        break;
      case 'dither':
        applyDitherFilter(data, canvasWidth, canvasHeight, params);
        break;
      case 'pixelate':
        applyPixelateFilter(data, canvasWidth, canvasHeight, params);
        break;
      // For image type, we don't need to apply any filter
      case 'image':
        break;
      // Default case - just display the original image
      default:
        console.log(`Filter type ${filterType} not implemented in fast preview`);
        break;
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

  const applyFindEdgesFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    // Simple Sobel edge detection implementation
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }

    // First convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const avg = (tempData[i] * 0.299 + tempData[i + 1] * 0.587 + tempData[i + 2] * 0.114);
      tempData[i] = avg;
      tempData[i + 1] = avg;
      tempData[i + 2] = avg;
    }

    // Apply edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Sobel kernels
        const gx = [
          -1, 0, 1,
          -2, 0, 2,
          -1, 0, 1
        ];
        const gy = [
          -1, -2, -1,
          0, 0, 0,
          1, 2, 1
        ];

        let valueX = 0;
        let valueY = 0;

        // Apply the kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            valueX += tempData[idx] * gx[kernelIdx];
            valueY += tempData[idx] * gy[kernelIdx];
          }
        }

        // Calculate gradient magnitude
        const magnitude = Math.min(255, Math.sqrt(valueX * valueX + valueY * valueY));
        
        const idx = (y * width + x) * 4;
        data[idx] = magnitude;
        data[idx + 1] = magnitude;
        data[idx + 2] = magnitude;
      }
    }
  };

  const applyGlowFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    const intensityParam = params.find(p => p.name === 'intensity');
    const radiusParam = params.find(p => p.name === 'radius');
    
    const intensity = intensityParam ? Number(intensityParam.value) / 100 : 0.5;
    const radius = radiusParam ? Math.min(Math.max(Number(radiusParam.value), 1), 20) : 5;
    
    // Create a copy of the original image data
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Apply blur for the glow effect
    const blurSize = Math.floor(radius);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let ky = -blurSize; ky <= blurSize; ky++) {
          const yy = y + ky;
          if (yy < 0 || yy >= height) continue;
          
          for (let kx = -blurSize; kx <= blurSize; kx++) {
            const xx = x + kx;
            if (xx < 0 || xx >= width) continue;
            
            const i = (yy * width + xx) * 4;
            r += tempData[i];
            g += tempData[i + 1];
            b += tempData[i + 2];
            count++;
          }
        }
        
        // Brighten the blurred result for the glow
        r = Math.min(255, r / count * (1 + intensity));
        g = Math.min(255, g / count * (1 + intensity));
        b = Math.min(255, b / count * (1 + intensity));
        
        // Blend the glow with the original image
        const i = (y * width + x) * 4;
        data[i] = Math.min(255, tempData[i] * (1 - intensity) + r * intensity);
        data[i + 1] = Math.min(255, tempData[i + 1] * (1 - intensity) + g * intensity);
        data[i + 2] = Math.min(255, tempData[i + 2] * (1 - intensity) + b * intensity);
      }
    }
  };

  const applyHalftoneFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    const sizeParam = params.find(p => p.name === 'size');
    const size = sizeParam ? Math.max(1, Number(sizeParam.value)) : 4;
    
    // Create a copy of the original data
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Clear the original data to black
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
    
    // Apply halftone pattern
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        // Calculate average brightness for this cell
        let totalBrightness = 0;
        let count = 0;
        
        for (let py = 0; py < size && y + py < height; py++) {
          for (let px = 0; px < size && x + px < width; px++) {
            const i = ((y + py) * width + (x + px)) * 4;
            const brightness = (tempData[i] + tempData[i + 1] + tempData[i + 2]) / 3;
            totalBrightness += brightness;
            count++;
          }
        }
        
        const avgBrightness = totalBrightness / count;
        const dotSize = (avgBrightness / 255) * size;
        
        // Draw the dot
        for (let py = 0; py < size && y + py < height; py++) {
          for (let px = 0; px < size && x + px < width; px++) {
            const i = ((y + py) * width + (x + px)) * 4;
            
            // Calculate distance from center of the cell
            const centerX = x + size / 2;
            const centerY = y + size / 2;
            const distX = px + x - centerX;
            const distY = py + y - centerY;
            const dist = Math.sqrt(distX * distX + distY * distY);
            
            if (dist < dotSize / 2) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            }
          }
        }
      }
    }
  };

  const applyWaveFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    const amplitudeParam = params.find(p => p.name === 'amplitude');
    const frequencyParam = params.find(p => p.name === 'frequency');
    
    const amplitude = amplitudeParam ? Number(amplitudeParam.value) : 10;
    const frequency = frequencyParam ? Number(frequencyParam.value) / 100 : 0.1;
    
    // Create a temporary buffer for the result
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Apply wave distortion
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate source position with wave distortion
        const xOffset = Math.sin(y * frequency) * amplitude;
        const srcX = Math.floor(x + xOffset);
        
        // Get pixel if within bounds, otherwise use original pixel
        if (srcX >= 0 && srcX < width) {
          const srcIdx = (y * width + srcX) * 4;
          const destIdx = (y * width + x) * 4;
          
          data[destIdx] = tempData[srcIdx];
          data[destIdx + 1] = tempData[srcIdx + 1];
          data[destIdx + 2] = tempData[srcIdx + 2];
        }
      }
    }
  };

  const applyExtrudeFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    const depthParam = params.find(p => p.name === 'depth');
    const depth = depthParam ? Number(depthParam.value) : 5;
    
    // Create a temporary buffer for the result
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Apply extrude effect
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentIdx = (y * width + x) * 4;
        const brightness = (tempData[currentIdx] + tempData[currentIdx + 1] + tempData[currentIdx + 2]) / 3;
        
        // Use brightness to determine the extrusion amount
        const extrudeAmount = (brightness / 255) * depth;
        
        // Sample from the offset position
        const srcX = Math.floor(x - extrudeAmount);
        const srcY = Math.floor(y - extrudeAmount);
        
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const srcIdx = (srcY * width + srcX) * 4;
          
          data[currentIdx] = tempData[srcIdx];
          data[currentIdx + 1] = tempData[srcIdx + 1];
          data[currentIdx + 2] = tempData[srcIdx + 2];
        }
      }
    }
  };

  const applyTextureFilter = (
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    params: FilterParam[]
  ) => {
    const strengthParam = params.find(p => p.name === 'strength');
    const scaleParam = params.find(p => p.name === 'scale');
    
    const strength = strengthParam ? Number(strengthParam.value) / 100 : 0.3;
    const scale = scaleParam ? Number(scaleParam.value) : 10;
    
    // Create a temporary buffer for the result
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Simple noise texture
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Generate noise at the given scale
        const noiseX = Math.floor(x / scale);
        const noiseY = Math.floor(y / scale);
        
        // Simple deterministic noise function (Perlin-like)
        const noise = Math.sin(noiseX * 0.1) * Math.cos(noiseY * 0.1) * 255;
        
        // Blend the noise with the original color
        data[idx] = Math.min(255, Math.max(0, tempData[idx] * (1 - strength) + noise * strength));
        data[idx + 1] = Math.min(255, Math.max(0, tempData[idx + 1] * (1 - strength) + noise * strength));
        data[idx + 2] = Math.min(255, Math.max(0, tempData[idx + 2] * (1 - strength) + noise * strength));
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