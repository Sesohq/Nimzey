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

    // Handle mouse down to start dragging
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      // Prevent default to avoid text selection during drag
      e.preventDefault();
      
      setIsDragging(true);
      updateValueFromPosition(e.clientX);
      
      // Add event listeners to document
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    // Handle touch start for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      // Prevent default to avoid scrolling during touch drag
      e.preventDefault();
      
      setIsDragging(true);
      updateValueFromPosition(e.touches[0].clientX);
      
      // Add event listeners to document
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    };

    // Update value based on mouse/touch position
    const updateValueFromPosition = (clientX: number) => {
      if (!containerRef.current) return;
      
      // Get the slider dimensions
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      
      // Calculate offset relative to the slider's left edge
      const offsetX = Math.max(0, Math.min(containerWidth, clientX - rect.left));
      
      // Calculate percentage (0 to 100)
      let percentage = (offsetX / containerWidth) * 100;
      
      // Calculate the new value based on percentage and range
      let newValue = min + (percentage / 100) * (max - min);
      
      // Apply step if provided
      if (step !== 0) {
        newValue = Math.round(newValue / step) * step;
      }
      
      // Clamp between min and max
      newValue = Math.max(min, Math.min(max, newValue));
      
      // We've finished calculating the value, no need for debug logging
      
      // Notify parent component
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    // Handle document mouse move for dragging
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateValueFromPosition(e.clientX);
      }
    };

    // Handle document touch move for mobile dragging
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault(); // Prevent scrolling while dragging
        updateValueFromPosition(e.touches[0].clientX);
      }
    };

    // Handle document mouse up to end dragging
    const handleMouseUp = (e: MouseEvent) => {
      // If we barely moved, treat it as a click
      if (isDragging) {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }
    };

    // Handle document touch end to end dragging on mobile
    const handleTouchEnd = (e: TouchEvent) => {
      if (isDragging) {
        setIsDragging(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      }
    };

    // Clean up event listeners on unmount
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
        ref={React.useMemo(() => {
          if (ref) {
            return ref;
          }
          return containerRef;
        }, [ref])}
        className={cn(
          "relative h-7 rounded overflow-hidden cursor-pointer select-none",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          className
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => {
          // Handle direct clicks without dragging
          if (!isDragging && !disabled) {
            updateValueFromPosition(e.clientX);
          }
        }}
        {...props}
      >
        {/* Background of slider */}
        <div className="absolute inset-0 bg-gray-700 dark:bg-gray-800"></div>
        
        {/* Fill layer */}
        <div 
          className="absolute h-full bg-blue-600 dark:bg-blue-600 transition-all duration-75"
          style={{ width: `${fillPercentage}%` }}
        ></div>
        
        {/* Value text */}
        <div className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-mono font-medium text-white">
          {getDisplayValue()}
        </div>
      </div>
    );
  }
);

ContainerSlider.displayName = "ContainerSlider";

export { ContainerSlider };