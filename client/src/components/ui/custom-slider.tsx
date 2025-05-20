import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface CustomSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  className?: string;
}

const CustomSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  CustomSliderProps
>(({ 
  className, 
  color = "primary", 
  size = "md", 
  startContent,
  endContent,
  ...props 
}, ref) => {
  // Color variants
  const colorVariants = {
    default: "bg-gray-200 [&>span]:bg-gray-800",
    primary: "bg-blue-100 [&>span]:bg-blue-600",
    secondary: "bg-purple-100 [&>span]:bg-purple-600",
    success: "bg-green-100 [&>span]:bg-green-600",
    warning: "bg-orange-100 [&>span]:bg-orange-500",
    danger: "bg-red-100 [&>span]:bg-red-500",
  };

  // Size variants
  const sizeVariants = {
    sm: "h-1.5 [&>span]:h-3 [&>span]:w-3",
    md: "h-2 [&>span]:h-4 [&>span]:w-4",
    lg: "h-3 [&>span]:h-5 [&>span]:w-5",
  };

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      {startContent && <div className="text-gray-500">{startContent}</div>}
      
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(
            "relative w-full grow overflow-hidden rounded-full",
            colorVariants[color],
            sizeVariants[size].split(" ")[0]
          )}
        >
          <SliderPrimitive.Range className="absolute h-full" />
        </SliderPrimitive.Track>
        
        <SliderPrimitive.Thumb
          className={cn(
            "block rounded-full border-2 border-white shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            colorVariants[color].split(" ")[1],
            sizeVariants[size].split(" ")[1],
            sizeVariants[size].split(" ")[2]
          )}
        />
      </SliderPrimitive.Root>
      
      {endContent && <div className="text-gray-500">{endContent}</div>}
    </div>
  );
});

CustomSlider.displayName = SliderPrimitive.Root.displayName;

export { CustomSlider };