import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
}

const ContainerSlider = React.forwardRef<HTMLDivElement, ContainerSliderProps>(
  (
    {
      className,
      value,
      min = 0,
      max = 100,
      step = 1,
      unit = "",
      disabled = false,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState<boolean>(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    
    // For event handler stability
    const dragStateRef = React.useRef({
      isDragging: false,
    });

    // Calculate percentage fill based on value and range
    const fillPercentage = ((value - min) / (max - min)) * 100;

    // Get formatted display value
    const getDisplayValue = () => {
      // If it's a whole number, show as integer
      if (Number.isInteger(value)) {
        return `${value}${unit}`;
      }
      // Otherwise show with up to 3 decimal places (but trim trailing zeros)
      return `${parseFloat(value.toFixed(3))}${unit}`;
    };

    // Update value based on mouse/touch position
    const updateValueFromPosition = (clientX: number) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const offsetX = Math.max(0, Math.min(containerWidth, clientX - rect.left));
      
      let percentage = (offsetX / containerWidth) * 100;
      let newValue = min + (percentage / 100) * (max - min);
      
      // Apply step if provided
      if (step !== 0) {
        newValue = Math.round(newValue / step) * step;
      }
      
      // Clamp between min and max
      newValue = Math.max(min, Math.min(max, newValue));
      
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      e.preventDefault();
      
      // Set dragging states
      setIsDragging(true);
      dragStateRef.current.isDragging = true;
      
      // Update value immediately at click position
      updateValueFromPosition(e.clientX);
      
      // Add document event listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (disabled || !dragStateRef.current.isDragging) return;
      
      e.preventDefault();
      updateValueFromPosition(e.clientX);
    };
    
    const handleMouseUp = () => {
      // Reset dragging states
      setIsDragging(false);
      dragStateRef.current.isDragging = false;
      
      // Remove document event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      e.preventDefault();
      
      // Set dragging states
      setIsDragging(true);
      dragStateRef.current.isDragging = true;
      
      // Update value immediately at touch position
      updateValueFromPosition(e.touches[0].clientX);
      
      // Add document event listeners
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (disabled || !dragStateRef.current.isDragging) return;
      
      e.preventDefault();
      updateValueFromPosition(e.touches[0].clientX);
    };
    
    const handleTouchEnd = () => {
      // Reset dragging states
      setIsDragging(false);
      dragStateRef.current.isDragging = false;
      
      // Remove document event listeners
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    
    // Cleanup on unmount
    React.useEffect(() => {
      const cleanup = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
      
      return cleanup;
    }, []);

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative h-7 rounded overflow-hidden select-none",
          isDragging ? "cursor-grabbing" : "cursor-pointer",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          className
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        {...props}
      >
        {/* Background of slider */}
        <div className="absolute inset-0 bg-gray-700 dark:bg-gray-800"></div>
        
        {/* Fill layer */}
        <div 
          className="absolute h-full bg-blue-600 dark:bg-blue-600"
          style={{ width: `${fillPercentage}%` }}
        ></div>
        
        {/* Value text */}
        <div className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-mono font-medium text-white pointer-events-none">
          {getDisplayValue()}
        </div>
      </div>
    );
  }
);

ContainerSlider.displayName = "ContainerSlider";

export { ContainerSlider };