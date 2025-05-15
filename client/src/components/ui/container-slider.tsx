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
    // State for tracking drag operations
    const [isDragging, setIsDragging] = React.useState<boolean>(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    
    // Store initial drag state for reference during drag operations
    const dragRef = React.useRef({
      startX: 0,
      startValue: 0,
      scale: 1, // Scale factor for drag sensitivity
      active: false
    });

    // Calculate percentage for fill bar
    const fillPercentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

    // Format the display value
    const getDisplayValue = () => {
      if (Number.isInteger(value)) {
        return `${value}${unit}`;
      }
      return `${parseFloat(value.toFixed(3))}${unit}`;
    };

    // Calculate new value based on drag movement
    const updateValueFromDrag = (clientX: number) => {
      if (!containerRef.current || !dragRef.current.active) return;
      
      // Get the container width for scale calculation
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      
      // Calculate movement as a percentage of container width
      const deltaX = clientX - dragRef.current.startX;
      const deltaPercentage = (deltaX / containerWidth) * 100 * dragRef.current.scale;
      
      // Convert percentage to value range and add to start value
      const valueRange = max - min;
      const deltaValue = (deltaPercentage / 100) * valueRange;
      let newValue = dragRef.current.startValue + deltaValue;
      
      // Apply step quantization if needed
      if (step !== 0) {
        newValue = Math.round(newValue / step) * step;
      }
      
      // Clamp to valid range
      newValue = Math.max(min, Math.min(max, newValue));
      
      // Update through callback
      if (onValueChange && newValue !== value) {
        onValueChange(newValue);
      }
    };
    
    // Set value directly from position (for clicks)
    const setValueFromPosition = (clientX: number) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const percentage = offsetX / rect.width;
      
      let newValue = min + percentage * (max - min);
      
      // Apply step if needed
      if (step !== 0) {
        newValue = Math.round(newValue / step) * step;
      }
      
      // Clamp to range
      newValue = Math.max(min, Math.min(max, newValue));
      
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    // Start dragging (mouse events)
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      // Prevent text selection
      e.preventDefault();
      
      // Initialize drag state
      dragRef.current = {
        startX: e.clientX,
        startValue: value,
        scale: 1, // Can be adjusted for different sensitivity
        active: true
      };
      
      setIsDragging(true);
      
      // For direct clicks, also update immediately
      if (e.target === containerRef.current) {
        setValueFromPosition(e.clientX);
        // Update start values after direct position change
        dragRef.current.startValue = value; 
      }
      
      // Add document event listeners for drag operations
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (disabled) return;
      
      e.preventDefault();
      if (dragRef.current.active) {
        updateValueFromDrag(e.clientX);
      }
    };
    
    const handleMouseUp = () => {
      // End drag operation
      dragRef.current.active = false;
      setIsDragging(false);
      
      // Remove document event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    // Touch event handlers (mobile)
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      // Prevent scrolling during drag
      e.preventDefault();
      
      // Initialize drag state
      dragRef.current = {
        startX: e.touches[0].clientX,
        startValue: value,
        scale: 1,
        active: true
      };
      
      setIsDragging(true);
      
      // For direct touches, also update immediately
      if (e.target === containerRef.current) {
        setValueFromPosition(e.touches[0].clientX);
        dragRef.current.startValue = value;
      }
      
      // Add document event listeners
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (disabled) return;
      
      // Prevent scrolling during drag
      e.preventDefault();
      
      if (dragRef.current.active) {
        updateValueFromDrag(e.touches[0].clientX);
      }
    };
    
    const handleTouchEnd = () => {
      // End drag operation
      dragRef.current.active = false;
      setIsDragging(false);
      
      // Remove document event listeners
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    
    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative h-7 rounded overflow-hidden select-none",
          isDragging ? "cursor-ew-resize" : "cursor-pointer",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          className
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        {...props}
      >
        {/* Background layer */}
        <div className="absolute inset-0 bg-gray-700 dark:bg-gray-800"></div>
        
        {/* Fill layer */}
        <div 
          className="absolute h-full bg-blue-600 dark:bg-blue-600"
          style={{ width: `${fillPercentage}%` }}
        ></div>
        
        {/* Value display */}
        <div className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-mono font-medium text-white pointer-events-none">
          {getDisplayValue()}
        </div>
      </div>
    );
  }
);

ContainerSlider.displayName = "ContainerSlider";

export { ContainerSlider };