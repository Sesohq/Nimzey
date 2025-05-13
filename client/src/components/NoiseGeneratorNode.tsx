import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FilterNodeData, BlendMode } from '@/types';
import NodeControls from './NodeControls';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { WandIcon } from 'lucide-react';

// Interface for the SimplexNoise class
class SimplexNoise {
  private perm: number[] = [];
  private gradP: number[][] = [];

  constructor(seed: string | number = Math.random()) {
    this.seed(seed);
  }

  private seed(seed: string | number) {
    let seedValue = typeof seed === 'number' ? seed : Math.abs(this.hashString(seed));
    const random = this.createSeededRandom(seedValue);

    // Initialize permutation and gradient arrays
    const p = Array.from({ length: 256 }, () => Math.floor(random() * 256));
    this.perm = [...p, ...p];
    this.gradP = Array(512).fill([0, 0]);

    // Populate gradient lookup table
    for (let i = 0; i < 512; i++) {
      const value = this.perm[i & 255] % 12;
      this.gradP[i] = this.grad3[value];
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  private createSeededRandom(seed: number) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];

  private dot2(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  public noise2D(x: number, y: number): number {
    // Find unit grid cell containing point
    let X = Math.floor(x);
    let Y = Math.floor(y);
    // Get relative coordinates of point within cell
    x = x - X;
    y = y - Y;
    // Wrap the integer cells at 255
    X = X & 255;
    Y = Y & 255;
    
    // Calculate noise contributions from each corner
    const n00 = this.dot2(this.gradP[(X + this.perm[Y]) & 511], x, y);
    const n01 = this.dot2(this.gradP[(X + this.perm[Y + 1]) & 511], x, y - 1);
    const n10 = this.dot2(this.gradP[(X + 1 + this.perm[Y]) & 511], x - 1, y);
    const n11 = this.dot2(this.gradP[(X + 1 + this.perm[Y + 1]) & 511], x - 1, y - 1);
    
    // Compute the fade curve
    const u = this.fade(x);
    const v = this.fade(y);
    
    // Interpolate the four results
    return this.lerp(
      this.lerp(n00, n10, u),
      this.lerp(n01, n11, u),
      v
    );
  }

  private lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
  }
}

// Utility function to convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const NoiseGeneratorNode = ({ data, selected, id }: NodeProps<FilterNodeData>) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showLargePreview, setShowLargePreview] = useState(false);
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Log when the component renders to debug preview data
  console.log(`NoiseGeneratorNode [${id}] rendering, preview:`,  
    data.preview ? `valid: ${data.preview.startsWith('data:image/')} length: ${data.preview.length}` : 'missing');
  
  // Function to generate the noise texture and return it as a data URL
  const generateNoiseTexture = () => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Find width and height parameters
    const widthParam = data.params.find(p => p.name === 'width');
    const heightParam = data.params.find(p => p.name === 'height');
    const width = widthParam ? Number(widthParam.value) : 256;
    const height = heightParam ? Number(heightParam.value) : 256;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Get other parameters
    const scaleParam = data.params.find(p => p.name === 'scale');
    const scale = scaleParam ? Number(scaleParam.value) : 0.1;
    
    const octavesParam = data.params.find(p => p.name === 'octaves');
    const octaves = octavesParam ? Number(octavesParam.value) : 4;
    
    const persistenceParam = data.params.find(p => p.name === 'persistence');
    const persistence = persistenceParam ? Number(persistenceParam.value) : 0.5;
    
    const lacunarityParam = data.params.find(p => p.name === 'lacunarity');
    const lacunarity = lacunarityParam ? Number(lacunarityParam.value) : 2.0;
    
    const seedParam = data.params.find(p => p.name === 'seed');
    const seed = seedParam ? Number(seedParam.value) : 42;
    
    const noiseTypeParam = data.params.find(p => p.name === 'noiseType');
    const noiseType = noiseTypeParam ? String(noiseTypeParam.value) : 'Perlin';
    
    const colorMapParam = data.params.find(p => p.name === 'colorMap');
    const colorMap = colorMapParam ? String(colorMapParam.value) : 'Grayscale';
    
    // Create image data
    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;
    
    // Initialize noise generator
    const simplex = new SimplexNoise(seed);
    
    // Generate the texture
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Calculate noise value based on the selected noise type
        let noiseValue = 0;
        
        switch (noiseType) {
          case 'Perlin':
          case 'Simplex':
            noiseValue = (simplex.noise2D(x * scale, y * scale) + 1) / 2;
            break;
          case 'Fractal Perlin':
          case 'Fractal Simplex':
            // Fractal Brownian Motion implementation
            let amplitude = 1;
            let frequency = scale;
            let maxValue = 0;
            noiseValue = 0;
            
            for (let o = 0; o < octaves; o++) {
              const value = (simplex.noise2D(x * frequency, y * frequency) + 1) / 2;
              noiseValue += value * amplitude;
              maxValue += amplitude;
              amplitude *= persistence;
              frequency *= lacunarity;
            }
            
            noiseValue /= maxValue; // Normalize to [0, 1]
            break;
          case 'Cellular':
          case 'Voronoi':
            // Simple implementation of cellular noise
            const cellSize = 1 / scale;
            const cellX = Math.floor(x / cellSize);
            const cellY = Math.floor(y / cellSize);
            let minDist = 1.0;
            
            for (let offY = -1; offY <= 1; offY++) {
              for (let offX = -1; offX <= 1; offX++) {
                const currentCellX = cellX + offX;
                const currentCellY = cellY + offY;
                
                // Generate a fixed point within the cell using deterministic random
                const cellPointX = currentCellX + 0.5 + (simplex.noise2D(currentCellX, currentCellY) * 0.5);
                const cellPointY = currentCellY + 0.5 + (simplex.noise2D(currentCellX + 1000, currentCellY) * 0.5);
                
                // Calculate distance from current pixel to the cell point
                const distX = x / cellSize - cellPointX;
                const distY = y / cellSize - cellPointY;
                const dist = Math.sqrt(distX * distX + distY * distY);
                
                minDist = Math.min(minDist, dist);
              }
            }
            
            noiseValue = minDist;
            break;
          case 'Gradient':
            // Simple gradient from bottom to top
            noiseValue = y / height;
            break;
          case 'Flow Field':
            // Flow field based on perlin noise direction
            const angle = simplex.noise2D(x * scale, y * scale) * Math.PI * 2;
            noiseValue = (Math.sin(angle) + 1) / 2;
            break;
          default:
            noiseValue = (simplex.noise2D(x * scale, y * scale) + 1) / 2;
        }
        
        // Apply color mapping
        let r, g, b;
        
        switch (colorMap) {
          case 'Grayscale':
            r = g = b = Math.round(noiseValue * 255);
            break;
          case 'Rainbow':
            [r, g, b] = hsvToRgb(noiseValue, 1, 1);
            break;
          case 'Fire':
            if (noiseValue < 0.33) {
              const t = noiseValue / 0.33;
              r = Math.round(255 * t);
              g = 0;
              b = 0;
            } else if (noiseValue < 0.66) {
              const t = (noiseValue - 0.33) / 0.33;
              r = 255;
              g = Math.round(255 * t);
              b = 0;
            } else {
              const t = (noiseValue - 0.66) / 0.34;
              r = 255;
              g = 255;
              b = Math.round(255 * t);
            }
            break;
          case 'Electric':
            r = Math.round(((Math.sin(noiseValue * Math.PI * 5) + 1) / 2) * 50);
            g = Math.round(((Math.cos(noiseValue * Math.PI * 5) + 1) / 2) * 200);
            b = Math.round(noiseValue * 255);
            break;
          case 'Earth':
            if (noiseValue < 0.4) {
              // Water
              r = 0;
              g = 0;
              b = Math.round(100 + 155 * (noiseValue / 0.4));
            } else if (noiseValue < 0.5) {
              // Sand
              const t = (noiseValue - 0.4) / 0.1;
              r = g = Math.round(194 + 61 * t);
              b = 0;
            } else if (noiseValue < 0.7) {
              // Grass
              const t = (noiseValue - 0.5) / 0.2;
              r = Math.round(34 - 34 * t);
              g = Math.round(139 + 36 * t);
              b = Math.round(34 - 34 * t);
            } else if (noiseValue < 0.9) {
              // Mountain
              const t = (noiseValue - 0.7) / 0.2;
              r = g = b = Math.round(90 + 35 * t);
            } else {
              // Snow
              r = g = b = 255;
            }
            break;
          case 'Ocean':
            r = Math.round(noiseValue * 50);
            g = Math.round(noiseValue * 100);
            b = Math.round(150 + noiseValue * 105);
            break;
          default:
            r = g = b = Math.round(noiseValue * 255);
        }
        
        // Set the pixel color
        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
        pixels[i + 3] = 255; // Fully opaque
      }
    }
    
    // Put the image data on the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Return the canvas as a data URL
    return canvas.toDataURL();
  };
  
  // Use direct preview from node data if available
  useEffect(() => {
    if (data.preview && data.preview.startsWith('data:image/')) {
      console.log(`Using provided preview for ${id} (noiseGenerator)`);
      setInternalPreviewUrl(data.preview);
    } else {
      console.log(`No valid preview found for ${id} (noiseGenerator), generating locally`);
      
      // Generate our own preview
      const textureDataUrl = generateNoiseTexture();
      
      if (textureDataUrl) {
        setInternalPreviewUrl(textureDataUrl);
        
        // Also update the node data with the preview
        if (data.onParamChange) {
          // Store in official preview prop
          data.onParamChange(id, 'preview', textureDataUrl);
        }
      } else {
        // Reset internal preview if texture generation failed
        if (internalPreviewUrl) {
          setInternalPreviewUrl(null);
        }
      }
    }
  }, [data.preview, data.params, id, internalPreviewUrl]);
  
  const handleToggleEnabled = (checked: boolean) => {
    if (data.onToggleEnabled) {
      data.onToggleEnabled(id, checked);
    }
  };
  
  const handleParamChange = (paramName: string, value: number | string) => {
    if (data.onParamChange) {
      data.onParamChange(id, paramName, value);
    }
  };
  
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-md border border-slate-200 w-72',
      selected ? 'ring-2 ring-blue-500' : ''
    )}>
      {/* Output Handle - This is the only connection point needed for the noise generator */}
      <div className="absolute right-0 top-[50%] flex items-center">
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 rounded-full -mr-1.5 bg-purple-500"
        />
        <div className="absolute right-2 top-[50%] transform translate-y-[-50%]">
          <Badge variant="outline" className="bg-white text-[10px] mr-2 shadow-sm">
            Texture Output
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-purple-500 mr-2 flex items-center justify-center">
              <WandIcon className="w-3 h-3 text-white" />
            </div>
            <h3 className="font-medium text-sm text-slate-700">{data.label}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <NodeControls 
              onMinimizeNode={() => setIsMinimized(!isMinimized)}
              onRemoveNode={data.onRemoveNode}
            />
          </div>
        </div>
        
        {/* Texture Source description */}
        <div className="mb-3 text-xs px-2 py-1 bg-purple-50 border border-purple-100 rounded text-purple-700">
          <div className="font-semibold mb-1">Texture Source</div>
          <div>Creates a procedural texture that can be connected to other nodes as an input source.</div>
        </div>
        
        {/* Hidden canvas for generating the texture */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
        />
        
        {/* Node Preview Area */}
        <div 
          className="mb-3 bg-gray-100 rounded border border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
          style={{ height: '100px' }}
          onClick={() => setShowLargePreview(!showLargePreview)}
        >
          {internalPreviewUrl ? (
            <div className="relative w-full h-full">
              <img 
                src={internalPreviewUrl} 
                alt="Noise preview" 
                className="w-full h-full object-cover"
                onLoad={() => console.log(`Preview image loaded successfully for ${id} (noiseGenerator)`)}
                onError={(e) => console.error(`Preview image failed to load for ${id} (noiseGenerator)`, e)}
              />
              <div className="absolute bottom-1 right-1">
                <Badge variant="secondary" className="text-[9px] bg-white/90 shadow-sm">
                  Click to enlarge
                </Badge>
              </div>
            </div>
          ) : (
            <div 
              className="text-xs text-gray-500 p-2 text-center flex flex-col items-center justify-center h-full cursor-pointer"
              onClick={(e) => {
                // Prevent opening large preview
                e.stopPropagation();
                
                // Try to manually refresh the preview
                console.log(`Manually refreshing preview for ${id} (noiseGenerator)`);
                
                // If we have an onTriggerPreviewUpdate function, call it
                if (data.onTriggerPreviewUpdate) {
                  data.onTriggerPreviewUpdate(id);
                }
              }}
            >
              {/* Simple message, no loading animation */}
              <div>No texture preview</div>
              <div className="text-[9px] text-purple-500 mt-2">
                Click to generate texture
              </div>
            </div>
          )}
        </div>
        
        {/* Large preview modal */}
        {showLargePreview && internalPreviewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowLargePreview(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl max-h-[80vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{data.label} Preview</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowLargePreview(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <img 
                src={internalPreviewUrl} 
                alt="Noise preview (large)" 
                className="max-w-full" 
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Label htmlFor={`${id}-enabled`} className="text-xs text-slate-500">
              Enabled
            </Label>
            <Badge variant="secondary" className="ml-2 text-[9px] bg-purple-100 text-purple-800">
              Texture Source
            </Badge>
          </div>
          <Switch 
            id={`${id}-enabled`}
            checked={data.enabled}
            onCheckedChange={handleToggleEnabled}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>
        
        {!isMinimized && (
          <div className="space-y-4">
            {/* Filter-specific parameters */}
            {data.params.map((param) => (
              <div key={param.name} className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor={`${id}-${param.name}`} className="text-xs text-slate-500">
                    {param.label}: {param.value}{param.unit || ''}
                  </Label>
                </div>
                {param.type === 'range' ? (
                  <Slider
                    id={`${id}-${param.name}`}
                    min={param.min || 0}
                    max={param.max || 100}
                    step={param.step || 1}
                    value={[Number(param.value)]}
                    onValueChange={(values) => handleParamChange(param.name, values[0])}
                    className="my-1"
                  />
                ) : param.type === 'select' && param.options ? (
                  <Select
                    value={String(param.value)}
                    onValueChange={(value) => handleParamChange(param.name, value)}
                  >
                    <SelectTrigger id={`${id}-${param.name}`} className="w-full">
                      <SelectValue placeholder={`Select ${param.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {param.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            ))}
            
            <div className="mt-2 pt-2 border-t border-gray-100">
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                Generates texture without input image
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(NoiseGeneratorNode);