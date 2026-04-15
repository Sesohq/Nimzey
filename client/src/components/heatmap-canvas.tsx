import React, { useEffect, useRef } from 'react';

interface HeatMapPoint {
  x: number;
  y: number;
  intensity: number;
}

interface HeatMapCanvasProps {
  points: HeatMapPoint[];
  width: number;
  height: number;
}

// Helper function to interpolate between gradient color stops
function interpolateGradient(value: number, colorStops: Array<{ stop: number; color: [number, number, number] }>) {
  // Clamp value between 0 and 1
  value = Math.max(0, Math.min(1, value));
  
  // Find the two color stops to interpolate between
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (value >= colorStops[i].stop && value <= colorStops[i + 1].stop) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const range = upperStop.stop - lowerStop.stop;
  const factor = range === 0 ? 0 : (value - lowerStop.stop) / range;
  
  // Interpolate RGB values
  const r = Math.round(lowerStop.color[0] + (upperStop.color[0] - lowerStop.color[0]) * factor);
  const g = Math.round(lowerStop.color[1] + (upperStop.color[1] - lowerStop.color[1]) * factor);
  const b = Math.round(lowerStop.color[2] + (upperStop.color[2] - lowerStop.color[2]) * factor);
  
  return { r, g, b };
}

export default function HeatMapCanvas({ points, width, height }: HeatMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = width;
    canvas.height = height;

    // Configuration
    const SCALE = 0.65;                    // Higher fidelity than 40%
    const BASE_RADIUS = 80;
    const MAX_OPACITY = 0.7;
    const GAMMA = 2.2;                     // Reduced from 2.8 to prevent over-boosting
    const COLOR_STOPS = [
      { stop: 0.00, color: [0, 0, 255] as [number, number, number] },     // blue
      { stop: 0.35, color: [0, 255, 255] as [number, number, number] },   // cyan
      { stop: 0.60, color: [255, 255, 0] as [number, number, number] },   // yellow
      { stop: 0.82, color: [255, 0, 0] as [number, number, number] },     // red
    ];

    // Z-score normalization for better spread
    const vals = points.map(p => p.intensity);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const std = Math.sqrt(variance);
    
    const normalizedPoints = points.map(p => {
      const zScore = std > 0 ? (p.intensity - mean) / (2 * std) + 0.5 : 0.5;
      const clamped = Math.max(0, Math.min(1, zScore));
      return { ...p, intensity: clamped };
    });
    
    // Debug histogram
    console.table(normalizedPoints.map((p, i) => ({ 
      index: i, 
      original: points[i].intensity, 
      normalized: p.intensity.toFixed(2) 
    })));

    // 1. Create off-screen canvas for better performance
    const off = document.createElement('canvas');
    off.width = Math.round(width * SCALE);   // 65% resolution for better fidelity
    off.height = Math.round(height * SCALE);
    const octx = off.getContext('2d')!;
    octx.clearRect(0, 0, off.width, off.height);
    octx.globalCompositeOperation = 'lighter';

    // 2. Paint soft white dots with two-ring system for larger haloes
    function drawDot(xPct: number, yPct: number, intensity: number) {
      const cx = (xPct / 100) * off.width;
      const cy = (yPct / 100) * off.height;

      const coreR = BASE_RADIUS * 0.4;   // red-zone radius (unchanged)
      const haloR = BASE_RADIUS * 0.9;   // reach of the coloured halo

      // --- Core (same as before) ---------------------------------
      const coreEnergy = Math.pow(intensity, 1 / 2);   // lots of energy
      octx.globalAlpha = coreEnergy;                    // up to 1.0
      const gCore = octx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      gCore.addColorStop(0, 'white');
      gCore.addColorStop(1, 'transparent');
      octx.fillStyle = gCore;
      octx.beginPath();
      octx.arc(cx, cy, coreR, 0, Math.PI * 2);
      octx.fill();

      // --- Halo (new) -------------------------------------------
      const haloEnergy = Math.pow(intensity, 1 / 2) * 0.35;  // faint, ≤ 0.35
      octx.globalAlpha = haloEnergy;
      const gHalo = octx.createRadialGradient(cx, cy, coreR, cx, cy, haloR);
      gHalo.addColorStop(0, 'white');
      gHalo.addColorStop(1, 'transparent');
      octx.fillStyle = gHalo;
      octx.beginPath();
      octx.arc(cx, cy, haloR, 0, Math.PI * 2);
      octx.fill();
    }

    // Add sanity test points for debugging
    const testPoints = [
      { x: 25, y: 25, intensity: 0.1 },  // should be blue
      { x: 50, y: 25, intensity: 0.5 },  // should be yellow
      { x: 75, y: 25, intensity: 1.0 }   // should be red
    ];
    
    // Draw test points first
    testPoints.forEach(point => {
      drawDot(point.x, point.y, point.intensity);
    });

    // Draw all points with normalized intensity
    normalizedPoints.forEach(point => {
      if (typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.intensity !== 'number') {
        return;
      }
      drawDot(point.x, point.y, point.intensity);
    });

    // 3. Blur the white gradients first
    octx.filter = `blur(${BASE_RADIUS * 0.9}px)`;
    octx.drawImage(off, 0, 0);          // blur in place
    octx.filter = 'none';

    // 4. Color mapping pass - AFTER blur, BEFORE drawImage to on-screen ctx
    const imgData = octx.getImageData(0, 0, off.width, off.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const a = imgData.data[i + 3] / 255;     // 0-1 post-blur alpha
      if (a === 0) continue;

      // Apply gamma boost to alpha
      const boostedAlpha = Math.pow(a, 1 / GAMMA);
      
      // Map alpha → RGB via 4-stop gradient
      const { r, g, b } = interpolateGradient(boostedAlpha, COLOR_STOPS);
      
      // Strengthen halo colors (boost non-red hues)
      const boost = boostedAlpha > 0.8 ? 1 : 1.25;  // push non-red hues
      imgData.data[i] = Math.min(255, r * boost);              // R
      imgData.data[i + 1] = Math.min(255, g * boost);          // G
      imgData.data[i + 2] = Math.min(255, b * boost);          // B
      // Scale alpha by boosted intensity for proper accumulation
      imgData.data[i + 3] = Math.round(boostedAlpha * 255);
    }
    octx.putImageData(imgData, 0, 0);

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(off, 0, 0, width, height); // upscale soft field

    // Remove dark wash - it was creating orange tint over everything

    // 4. Color-map by ALPHA channel
    const img = ctx.getImageData(0, 0, width, height);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const heat = Math.min(1, data[i + 3] / 255);  // alpha → 0-1
      if (heat === 0) continue;

      const { r, g, b } = interpolateGradient(heat, COLOR_STOPS);
      const a = heat * MAX_OPACITY;

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a * 255;
    }
    ctx.putImageData(img, 0, 0);

    // Add light halo effect for professional polish
    ctx.save();
    ctx.filter = 'blur(12px)';
    ctx.globalAlpha = 0.4;         // subtle glow
    ctx.drawImage(canvas, 0, 0);   // self-draw for halo
    ctx.restore();
  }, [points, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        mixBlendMode: 'screen', // Screen blend for proper gradient display
        opacity: 1, // Full opacity for maximum color impact
        pointerEvents: 'none',
      }}
      className="rounded-lg"
    />
  );
}