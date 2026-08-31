import { cn } from "@/lib/utils";

/* All decoration is aria-hidden + pointer-events-none. Colours come from the
   .tuklas-lp tokens so it stays on-theme in light (and a future dark). */

/* -- topographic contour lines ---------------------------------------- */

function contourPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
): string {
  const steps = 28;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const w =
      1 +
      0.06 * Math.sin(a * 3 + seed) +
      0.035 * Math.sin(a * 5 + seed * 1.7) +
      0.02 * Math.cos(a * 2 - seed);
    const x = cx + Math.cos(a) * rx * w;
    const y = cy + Math.sin(a) * ry * w;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

export function TopoLines({ className }: { className?: string }) {
  const rings = 8;
  return (
    <svg
      aria-hidden
      viewBox="0 0 760 620"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute", className)}
    >
      {Array.from({ length: rings }, (_, i) => {
        const t = (i + 1) / rings;
        return (
          <path
            key={i}
            d={contourPath(430, 300, 90 + t * 300, 70 + t * 240, i * 1.3)}
            fill="none"
            stroke="var(--lp-line)"
            strokeWidth={1}
            strokeOpacity={0.55 - t * 0.32}
          />
        );
      })}
    </svg>
  );
}

/* -- compass rose ---------------------------------------------------- */

export function CompassRose({
  className,
  spin = false,
}: {
  className?: string;
  spin?: boolean;
}) {
  const f = (n: number) => n.toFixed(2);

  const pts = Array.from({ length: 72 }, (_, i) => {
    const a = (i * 5 * Math.PI) / 180;
    const long = i % 6 === 0;
    const r1 = long ? 78 : 84;
    return (
      <line
        key={i}
        x1={f(100 + Math.cos(a) * r1)}
        y1={f(100 + Math.sin(a) * r1)}
        x2={f(100 + Math.cos(a) * 90)}
        y2={f(100 + Math.sin(a) * 90)}
        stroke="var(--lp-line)"
        strokeWidth={long ? 1.4 : 0.8}
      />
    );
  });

  const star = (len: number, w: number, rot: number) => {
    const g = [];
    for (let k = 0; k < 4; k++) {
      const a = ((k * 90 + rot) * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const tip = `${f(100 + ca * len)} ${f(100 + sa * len)}`;
      const bl = `${f(100 + Math.cos(a + Math.PI / 2) * w)} ${f(100 + Math.sin(a + Math.PI / 2) * w)}`;
      const br = `${f(100 + Math.cos(a - Math.PI / 2) * w)} ${f(100 + Math.sin(a - Math.PI / 2) * w)}`;
      g.push(
        <polygon
          key={k}
          points={`${tip} ${bl} 100 100 ${br}`}
          fill="var(--brand-gold)"
          fillOpacity={k % 2 === 0 ? 0.5 : 0.32}
          stroke="var(--brand-gold)"
          strokeOpacity={0.5}
          strokeWidth={0.8}
        />,
      );
    }
    return g;
  };

  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={cn("pointer-events-none absolute", className)}
    >
      <g className={spin ? "lp-spin-slow" : undefined}>
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="var(--lp-line)"
          strokeWidth="1.2"
        />
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke="var(--lp-line)"
          strokeWidth="0.8"
        />
        {pts}
        {star(64, 12, 45)}
        {star(88, 9, 0)}
        <circle cx="100" cy="100" r="3.5" fill="var(--brand-gold)" />
      </g>
      <text
        x="100"
        y="24"
        textAnchor="middle"
        className="lp-data"
        fontSize="11"
        fill="var(--lp-muted)"
      >
        N
      </text>
    </svg>
  );
}

/* -- dotted travel path + pin -------------------------------------- */

export function DottedPath({
  className,
  drawn,
}: {
  className?: string;
  drawn: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{
        clipPath: drawn ? "inset(0 -2% 0 0)" : "inset(0 100% 0 0)",
        transition: "clip-path 1.5s var(--lp-ease)",
      }}
    >
      <svg viewBox="0 0 320 130" className="h-full w-full overflow-visible">
        <path
          d="M8 104 C 70 40, 120 128, 176 74 S 268 22, 300 44"
          fill="none"
          stroke="var(--lp-amber)"
          strokeOpacity="0.55"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="1.5 7"
        />
        <g
          style={{
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.4s var(--lp-ease) 1.2s",
          }}
        >
          <path
            d="M300 30 c 7 0 12 5 12 12 0 9 -12 20 -12 20 s -12 -11 -12 -20 c 0 -7 5 -12 12 -12 z"
            fill="var(--lp-amber)"
            fillOpacity="0.8"
          />
          <circle cx="300" cy="42" r="4" fill="var(--lp-paper)" />
        </g>
      </svg>
    </div>
  );
}
