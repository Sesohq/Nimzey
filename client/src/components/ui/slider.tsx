import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      orientation = "horizontal",
      disabled = false,
      onValueChange,
      onValueCommit,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState<boolean>(false);
    const trackRef = React.useRef<HTMLDivElement>(null);
    const thumbRef = React.useRef<HTMLDivElement>(null);
    
    // Used for event handler stability
    const dragStateRef = React.useRef({
      isDragging: false,
      originalValue: value[0]
    });

    // Calculate percentage for thumb and range positioning
    const percentage = ((value[0] - min) / (max - min)) * 100;

    // Update value based on mouse/touch position
    const updateValueFromPosition = (clientX: number) => {
      if (!trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const trackLength = rect.width;
      
      // Calculate position relative to track
      const offset = Math.max(0, Math.min(trackLength, clientX - rect.left));
      const percentage = offset / trackLength;
      
      // Calculate new value
      let newValue = min + percentage * (max - min);
      
      // Apply step if provided
      if (step !== 0) {
        newValue = Math.round(newValue / step) * step;
      }
      
      // Clamp between min and max
      newValue = Math.max(min, Math.min(max, newValue));
      
      if (onValueChange) {
        onValueChange([newValue]);
      }
    };

    // Handle mouse interactions
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      e.preventDefault();
      
      // Set dragging flag
      setIsDragging(true);
      dragStateRef.current.isDragging = true;
      dragStateRef.current.originalValue = value[0];
      
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
      if (dragStateRef.current.isDragging && onValueCommit) {
        onValueCommit(value);
      }
      
      // Reset dragging state
      setIsDragging(false);
      dragStateRef.current.isDragging = false;
      
      // Remove document event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    // Handle touch interactions for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      // Set dragging flag
      setIsDragging(true);
      dragStateRef.current.isDragging = true;
      dragStateRef.current.originalValue = value[0];
      
      // Update value immediately at touch position
      updateValueFromPosition(e.touches[0].clientX);
      
      // Add document event listeners
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (disabled || !dragStateRef.current.isDragging) return;
      
      e.preventDefault(); // Prevent scrolling while dragging
      updateValueFromPosition(e.touches[0].clientX);
    };
    
    const handleTouchEnd = () => {
      if (dragStateRef.current.isDragging && onValueCommit) {
        onValueCommit(value);
      }
      
      // Reset dragging state
      setIsDragging(false);
      dragStateRef.current.isDragging = false;
      
      // Remove document event listeners
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    
    // Cleanup event listeners on unmount
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
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {/* Track */}
        <div
          ref={trackRef}
          className={cn(
            "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary",
            isDragging && "cursor-grabbing"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Range */}
          <div 
            className="absolute h-full bg-primary" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Thumb */}
        <div
          ref={thumbRef}
          className={cn(
            "absolute block h-5 w-5 rounded-full border-2 border-primary bg-background",
            "ring-offset-background transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isDragging && "cursor-grabbing",
            disabled && "opacity-50 pointer-events-none"
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
