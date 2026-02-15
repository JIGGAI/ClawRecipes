type Props = {
  direction?: "left" | "right";
  width?: number;
  height?: number;
  className?: string;
};

/** Chevron icon for expand/collapse (ActivityFeed, etc.). */
export function IconChevron({ direction = "left", width = 10, height = 10, className }: Props) {
  const path =
    direction === "left"
      ? "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      : "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z";
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}
