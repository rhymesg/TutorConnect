"use client";

import React, { useCallback, useEffect } from "react";

import { cn } from "@/lib/utils";

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export const MagicCard: React.FC<MagicCardProps> = ({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#3b82f6",
  gradientOpacity = 0.03,
}) => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!mounted) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      e.currentTarget.style.setProperty("--x", `${x}px`);
      e.currentTarget.style.setProperty("--y", `${y}px`);
    },
    [mounted],
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-0 transition-all duration-300",
        "hover:border-neutral-300",
        "[&>*]:relative [&>*]:z-10",
        className,
      )}
      style={
        {
          "--gradient-size": `${gradientSize}px`,
          "--gradient-color": gradientColor,
          "--gradient-opacity": gradientOpacity,
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(var(--gradient-size) circle at var(--x, 0) var(--y, 0), var(--gradient-color), transparent 70%)`,
          opacity: "var(--gradient-opacity)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100">
        <div
          className="absolute -inset-px rounded-xl"
          style={{
            background: `radial-gradient(var(--gradient-size) circle at var(--x, 0) var(--y, 0), var(--gradient-color), transparent 70%)`,
            opacity: "var(--gradient-opacity)",
          }}
        />
      </div>
      {children}
    </div>
  );
};