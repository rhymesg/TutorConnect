"use client";

import { forwardRef, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement>;
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export const AnimatedBeam = forwardRef<SVGSVGElement, AnimatedBeamProps>(
  (
    {
      className,
      containerRef,
      fromRef,
      toRef,
      curvature = 0,
      reverse = false,
      duration = 4, // Slower for Norwegian aesthetic
      delay = 0,
      pathColor = "rgb(156 163 175)", // Neutral gray for Norwegian style
      pathWidth = 2,
      pathOpacity = 0.2,
      gradientStartColor = "#0ea5e9", // Brand blue
      gradientStopColor = "#0284c7", // Darker brand blue
      startXOffset = 0,
      startYOffset = 0,
      endXOffset = 0,
      endYOffset = 0,
    },
    ref,
  ) => {
    const id = useId();
    const svgRef = useRef<SVGSVGElement>(null);
    const pathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const resizeObserver = new ResizeObserver((entries) => {
          // Trigger a rerender when the container resizes
          if (svgRef.current) {
            updatePath();
          }
        });

        resizeObserver.observe(containerRef.current);

        const updatePath = () => {
          if (!fromRef.current || !toRef.current || !containerRef.current) {
            return;
          }

          const containerRect = containerRef.current.getBoundingClientRect();
          const rectA = fromRef.current.getBoundingClientRect();
          const rectB = toRef.current.getBoundingClientRect();

          const svgWidth = containerRect.width;
          const svgHeight = containerRect.height;
          
          const startX = rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
          const startY = rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
          const endX = rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
          const endY = rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

          const controlPointX = (startX + endX) / 2;
          const controlPointY = (startY + endY) / 2 - curvature;

          const d = `M ${startX},${startY} Q ${controlPointX},${controlPointY} ${endX},${endY}`;
          pathRef.current?.setAttribute("d", d);
        };

        // Call updatePath initially and whenever the window resizes
        updatePath();
        window.addEventListener("resize", updatePath);

        return () => {
          resizeObserver.disconnect();
          window.removeEventListener("resize", updatePath);
        };
      }
    }, [
      containerRef,
      fromRef,
      toRef,
      curvature,
      startXOffset,
      startYOffset,
      endXOffset,
      endYOffset,
    ]);

    return (
      <svg
        ref={svgRef}
        fill="none"
        width="100%"
        height="100%"
        className={cn(
          "pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
          className,
        )}
        viewBox={`0 0 ${containerRef.current?.offsetWidth || 0} ${
          containerRef.current?.offsetHeight || 0
        }`}
      >
        <defs>
          <linearGradient id={`gradient-${id}`} gradientUnits="userSpaceOnUse">
            <stop stopColor={gradientStartColor} stopOpacity="0" />
            <stop stopColor={gradientStartColor} />
            <stop offset="32.5%" stopColor={gradientStopColor} />
            <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          stroke={pathColor}
          strokeWidth={pathWidth}
          strokeOpacity={pathOpacity}
          strokeLinecap="round"
        />
        <path
          stroke={`url(#gradient-${id})`}
          strokeWidth={pathWidth}
          strokeLinecap="round"
          strokeDasharray="20,20"
          className={cn(
            "[animation:var(--animate-beam-flow)]",
            reverse ? "animate-reverse" : "",
          )}
          style={{
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
        />
      </svg>
    );
  },
);

AnimatedBeam.displayName = "AnimatedBeam";