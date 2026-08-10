/**
 * Structural SVG that visually welds the hero orb to the rotary menu —
 * the “one machine” chassis from the original Xbox dashboard.
 *
 * Orb socket sits further right so the hub docks against the dial clearance
 * (arc geometry itself lives in WorkLinks — do not retune radii here).
 */
export default function DashboardChassis() {
  const orbX = 318;
  const orbY = 360;

  return (
    <svg
      className="dashboard-chassis"
      viewBox="0 0 1100 720"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="chassisRail" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(120,255,90,0.05)" />
          <stop offset="35%" stopColor="rgba(160,255,110,0.55)" />
          <stop offset="75%" stopColor="rgba(200,255,120,0.4)" />
          <stop offset="100%" stopColor="rgba(100,255,80,0.08)" />
        </linearGradient>
        <linearGradient id="chassisArc" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="rgba(140,255,100,0.55)" />
          <stop offset="55%" stopColor="rgba(180,255,120,0.28)" />
          <stop offset="100%" stopColor="rgba(80,200,60,0.05)" />
        </linearGradient>
        <filter id="chassisGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shared rotary ring — origin near orb, sweeps through dial nodes */}
      <path
        d="M 420 360
           C 490 220, 640 175, 790 250
           C 865 295, 900 360, 910 430
           C 920 510, 880 580, 800 620"
        fill="none"
        stroke="url(#chassisArc)"
        strokeWidth="2.2"
        filter="url(#chassisGlow)"
        opacity="0.85"
      />
      <path
        d="M 430 360
           C 500 235, 630 200, 770 270
           C 835 310, 870 365, 880 430"
        fill="none"
        stroke="rgba(100,255,120,0.22)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Primary conduit from orb housing into the dial arc */}
      <path
        d={`M ${orbX + 108} ${orbY} L 470 ${orbY} C 520 ${orbY}, 545 340, 575 315`}
        fill="none"
        stroke="url(#chassisRail)"
        strokeWidth="1.6"
        filter="url(#chassisGlow)"
      />
      <path
        d={`M ${orbX + 108} ${orbY + 12} L 478 ${orbY + 12} C 525 ${orbY + 12}, 558 355, 588 332`}
        fill="none"
        stroke="rgba(140,255,120,0.28)"
        strokeWidth="1"
      />

      {/* Irregular socket ticks — not an even clock ring */}
      {([0.02, 0.09, 0.18, 0.27, 0.41, 0.48, 0.61, 0.72, 0.81, 0.93] as const).map(
        (frac, i) => {
          const a = frac * Math.PI * 2 - Math.PI / 2;
          const r0 = 118;
          const r1 = i % 3 === 0 ? 134 : i % 2 === 0 ? 128 : 124;
          return (
            <line
              key={frac}
              x1={orbX + Math.cos(a) * r0}
              y1={orbY + Math.sin(a) * r0}
              x2={orbX + Math.cos(a) * r1}
              y2={orbY + Math.sin(a) * r1}
              stroke="rgba(160,255,120,0.45)"
              strokeWidth={i % 4 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        }
      )}

      {/* Socket ring gripping the orb */}
      <circle
        cx={orbX}
        cy={orbY}
        r="112"
        fill="none"
        stroke="rgba(180,255,140,0.35)"
        strokeWidth="1.4"
      />
      <circle
        cx={orbX}
        cy={orbY}
        r="104"
        fill="none"
        stroke="rgba(100,255,90,0.18)"
        strokeWidth="3"
      />

      {/* Junction hubs where conduits meet the dial rail */}
      <circle cx="470" cy={orbY} r="4" fill="rgba(210,255,120,0.7)" />
      <circle
        cx="470"
        cy={orbY}
        r="8"
        fill="none"
        stroke="rgba(160,255,110,0.45)"
        strokeWidth="1"
      />
      <circle cx="575" cy="315" r="3.5" fill="rgba(200,255,130,0.65)" />
      <circle
        cx="575"
        cy="315"
        r="7"
        fill="none"
        stroke="rgba(140,255,100,0.4)"
        strokeWidth="1"
      />

      {/* Secondary spine under the blades */}
      <path
        d="M 590 305 C 660 282, 730 290, 820 340"
        fill="none"
        stroke="rgba(120,255,100,0.2)"
        strokeWidth="1.2"
        strokeDasharray="3 6"
      />
    </svg>
  );
}
