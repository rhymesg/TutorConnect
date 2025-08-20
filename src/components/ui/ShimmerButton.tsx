"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.1em", 
      borderRadius = "0.5rem",
      shimmerDuration = "3s", // Slower, more subtle for Norwegian aesthetic
      background = "linear-gradient(135deg, rgba(14, 165, 233, 0.9), rgba(2, 132, 199, 0.95))", // Norwegian brand colors
      className,
      children,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? "div" : "button";
    
    return (
      <Component
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-2 text-white [background:var(--bg)] [border-radius:var(--radius)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-[1px]",
          className,
        )}
        ref={asChild ? undefined : ref}
        {...(asChild ? {} : props)}
      >
        {/* spark container */}
        <div
          className={cn(
            "-z-30 blur-[2px]",
            "absolute inset-0 overflow-visible [container-type:size]",
          )}
        >
          {/* spark */}
          <div className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none] [animation:var(--animate-shimmer-slide)]">
            {/* spark before */}
            <div className="absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0] [animation:var(--animate-spin-around)]" />
          </div>
        </div>
        
        {/* Backdrop */}
        <div
          className={cn(
            "-z-20",
            "absolute inset-[var(--cut)] rounded-[calc(var(--radius)-var(--cut))] bg-neutral-900/80 backdrop-blur-sm",
            "group-hover:bg-neutral-900/70",
            "transition-colors duration-300",
          )}
        />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          {children}
        </div>
      </Component>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";

export { ShimmerButton };