import React from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  background?: React.ReactNode;
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid auto-rows-[22rem] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BentoGrid.displayName = "BentoGrid";

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, title, description, children, icon, background, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg",
          "hover:border-brand-200 hover:bg-gradient-to-br hover:from-white hover:to-brand-50/30",
          className
        )}
        {...props}
      >
        {/* Background Element (if provided) */}
        {background && (
          <div className="absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-80">
            {background}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col">
          {/* Icon and Title */}
          {(icon || title) && (
            <div className="flex items-center space-x-3 mb-4">
              {icon && (
                <div className="flex-shrink-0">
                  {icon}
                </div>
              )}
              {title && (
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-brand-700 transition-colors">
                  {title}
                </h3>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-neutral-600 group-hover:text-neutral-700 transition-colors mb-4">
              {description}
            </p>
          )}

          {/* Custom Content */}
          {children && (
            <div className="flex-1">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }
);
BentoCard.displayName = "BentoCard";

export { BentoGrid, BentoCard };