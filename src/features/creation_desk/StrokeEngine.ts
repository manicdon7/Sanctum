export interface Point {
  x: number;
  y: number;
  time: number;
}

export interface StrokePath {
  id: string;
  points: Point[];
  color: string;
  // Pre-calculated widths/opacities per point for rendering physical marks
  widths: number[];
  opacity: number;
}

/**
 * Heuristics to make draw marks feel physical:
 * - A fast stroke (large distance/time delta) gets slightly thinner.
 * - A slow deliberate stroke gets slightly thicker.
 * - Adds a low-frequency sine oscillation to simulate ink bleed/flow variation.
 */
export function calculateStrokeAttributes(
  points: Point[],
  baseWidth = 3,
  color = '#B87461'
): { widths: number[]; opacity: number } {
  if (points.length === 0) return { widths: [], opacity: 0.95 };

  const widths: number[] = [];
  const averageVelocity = calculateAverageVelocity(points);

  for (let i = 0; i < points.length; i++) {
    const pt = points[i]!;
    let velocity = 0;

    if (i > 0) {
      const prev = points[i - 1]!;
      const dx = pt.x - prev.x;
      const dy = pt.y - prev.y;
      const dt = pt.time - prev.time || 1;
      velocity = Math.hypot(dx, dy) / dt;
    } else {
      velocity = averageVelocity;
    }

    // Speed heuristic: thin out when moving fast, thicken when moving slow
    // Bound width between baseWidth * 0.5 and baseWidth * 1.8
    const speedFactor = Math.max(0.5, Math.min(1.8, 1.2 - velocity * 0.1));
    let width = baseWidth * speedFactor;

    // Ink bleed/flow simulation: low-frequency sine modulation
    const bleedModulation = 1 + 0.12 * Math.sin(pt.x * 0.05 + pt.y * 0.05);
    width *= bleedModulation;

    widths.push(width);
  }

  // Vary opacity based on speed (fast strokes are lighter, slow strokes are fully opaque)
  const speedOpacity = Math.max(0.85, Math.min(1.0, 1.0 - averageVelocity * 0.05));

  return { widths, opacity: speedOpacity };
}

function calculateAverageVelocity(points: Point[]): number {
  if (points.length < 2) return 0.5;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const totalDist = points.reduce((acc, pt, idx) => {
    if (idx === 0) return 0;
    const prev = points[idx - 1]!;
    return acc + Math.hypot(pt.x - prev.x, pt.y - prev.y);
  }, 0);
  const totalTime = last.time - first.time || 1;
  return totalDist / totalTime;
}

/**
 * Converts a set of points and their corresponding widths into an SVG path string
 * utilizing Bezier curves for smooth joins.
 */
export function pointsToSvgPath(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0]!.x} ${points[0]!.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const pt = points[i]!;
    const next = points[i + 1]!;
    const xc = (pt.x + next.x) / 2;
    const yc = (pt.y + next.y) / 2;
    d += ` Q ${pt.x} ${pt.y}, ${xc} ${yc}`;
  }

  // Connect last point
  d += ` L ${points[points.length - 1]!.x} ${points[points.length - 1]!.y}`;
  return d;
}
