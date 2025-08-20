import { useId } from "react";
import { cn } from "@/lib/utils";

interface GridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  squares?: number[][];
  strokeDasharray?: string;
  className?: string;
  [key: string]: unknown;
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  squares = [],
  strokeDasharray = "0",
  className,
  ...props
}: GridPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-100/20 stroke-neutral-200/30",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      {squares.map(([x, y], index) => (
        <rect
          key={`${x}-${y}-${index}`}
          width={width - 1}
          height={height - 1}
          x={x * width + 1}
          y={y * height + 1}
          className="fill-neutral-200/40 stroke-neutral-300/60"
          strokeDasharray={strokeDasharray}
        />
      ))}
    </svg>
  );
}