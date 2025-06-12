import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
}

export function ColorPicker({ color, onChange, onClose, isOpen, triggerRef }: ColorPickerProps) {
  console.log('=== ColorPicker Component ===');
  console.log('isOpen:', isOpen);
  console.log('color:', color);
  console.log('triggerRef:', triggerRef);
  
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [hexValue, setHexValue] = useState(color);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const saturationRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  
  // Convert hex to HSL
  const hexToHsl = useCallback((hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
      
      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }
    
    return [h * 360, s * 100, l * 100];
  }, []);
  
  // Convert HSL to hex
  const hslToHex = useCallback((h: number, s: number, l: number): string => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);
  
  // Initialize HSL from current color
  useEffect(() => {
    const [h, s, l] = hexToHsl(color);
    setHue(h);
    setSaturation(s);
    setLightness(l);
    setHexValue(color);
  }, [color, hexToHsl]);
  
  // Draw saturation/lightness picker
  useEffect(() => {
    const canvas = saturationRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Create gradient from white to pure hue
    const gradientH = ctx.createLinearGradient(0, 0, width, 0);
    gradientH.addColorStop(0, 'white');
    gradientH.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
    
    ctx.fillStyle = gradientH;
    ctx.fillRect(0, 0, width, height);
    
    // Create gradient from transparent to black
    const gradientV = ctx.createLinearGradient(0, 0, 0, height);
    gradientV.addColorStop(0, 'transparent');
    gradientV.addColorStop(1, 'black');
    
    ctx.fillStyle = gradientV;
    ctx.fillRect(0, 0, width, height);
  }, [hue]);
  
  // Draw hue slider
  useEffect(() => {
    const canvas = hueRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    for (let i = 0; i <= 360; i += 60) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);
  
  // Handle saturation/lightness click
  const handleSaturationClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = saturationRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSaturation = (x / rect.width) * 100;
    const newLightness = 100 - (y / rect.height) * 100;
    
    setSaturation(newSaturation);
    setLightness(newLightness);
    
    const newHex = hslToHex(hue, newSaturation, newLightness);
    setHexValue(newHex);
    onChange(newHex);
  }, [hue, hslToHex, onChange]);
  
  // Handle hue click
  const handleHueClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = hueRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    const newHue = (y / rect.height) * 360;
    setHue(newHue);
    
    const newHex = hslToHex(newHue, saturation, lightness);
    setHexValue(newHex);
    onChange(newHex);
  }, [saturation, lightness, hslToHex, onChange]);
  
  // Handle hex input change
  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const [h, s, l] = hexToHsl(value);
      setHue(h);
      setSaturation(s);
      setLightness(l);
      onChange(value);
    }
  }, [hexToHsl, onChange]);
  
  // Position the picker relative to trigger
  const getPickerPosition = useCallback(() => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    return {
      top: triggerRect.bottom + 8,
      left: triggerRect.left
    };
  }, [triggerRef]);
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);
  
  if (!isOpen) return null;
  
  const position = getPickerPosition();
  
  const colorPickerContent = (
    <div
      ref={pickerRef}
      className="fixed z-[9999] shadow-lg"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <Card className="p-4 w-64 bg-white border border-gray-200">
        <div className="space-y-3">
          {/* Saturation/Lightness picker */}
          <div className="relative">
            <canvas
              ref={saturationRef}
              width={240}
              height={150}
              className="cursor-crosshair rounded border border-gray-300"
              onClick={handleSaturationClick}
            />
            {/* Current color indicator */}
            <div
              className="absolute w-3 h-3 border-2 border-white rounded-full pointer-events-none"
              style={{
                left: `${(saturation / 100) * 240 - 6}px`,
                top: `${((100 - lightness) / 100) * 150 - 6}px`,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
              }}
            />
          </div>
          
          {/* Hue slider */}
          <div className="relative">
            <canvas
              ref={hueRef}
              width={240}
              height={20}
              className="cursor-crosshair rounded border border-gray-300"
              onClick={handleHueClick}
            />
            {/* Hue indicator */}
            <div
              className="absolute w-full h-1 border-l-2 border-r-2 border-white pointer-events-none"
              style={{
                top: `${(hue / 360) * 20 - 2}px`,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
              }}
            />
          </div>
          
          {/* Color preview and hex input */}
          <div className="flex items-center space-x-2">
            <div
              className="w-12 h-8 rounded border border-gray-300"
              style={{ backgroundColor: hexValue }}
            />
            <Input
              type="text"
              value={hexValue}
              onChange={handleHexChange}
              className="flex-1 text-xs font-mono"
              placeholder="#ffffff"
            />
          </div>
          
          {/* Preset colors */}
          <div className="grid grid-cols-8 gap-1">
            {[
              '#FF0000', '#FF8000', '#FFFF00', '#80FF00',
              '#00FF00', '#00FF80', '#00FFFF', '#0080FF',
              '#0000FF', '#8000FF', '#FF00FF', '#FF0080',
              '#FFFFFF', '#C0C0C0', '#808080', '#000000'
            ].map((presetColor) => (
              <button
                key={presetColor}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  const [h, s, l] = hexToHsl(presetColor);
                  setHue(h);
                  setSaturation(s);
                  setLightness(l);
                  setHexValue(presetColor);
                  onChange(presetColor);
                }}
              />
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={onClose}>
              OK
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // Use portal to render outside the ReactFlow node
  return createPortal(colorPickerContent, document.body);
}