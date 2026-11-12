import React, { useEffect, useState, useMemo } from 'react';

interface WireBundleProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  featuredRef: React.RefObject<HTMLDivElement | null>;
  leftClusterRef: React.RefObject<HTMLDivElement | null>;
  rightClusterRef: React.RefObject<HTMLDivElement | null>;
  paginationRef: React.RefObject<HTMLDivElement | null>;
}

interface Coordinates {
  width: number;
  height: number;
  trunkStart: { x: number; y: number };
  trunkEnd: { x: number; y: number };
  leftTarget: { x: number; y: number };
  rightTarget: { x: number; y: number };
}

export default function WireBundle({
  containerRef,
  featuredRef,
  leftClusterRef,
  rightClusterRef,
  paginationRef,
}: WireBundleProps) {
  const [coords, setCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    function computePoints() {
      if (!containerRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();

      // Trunk start: right below featured row or default ~400px down
      let startX = cRect.width * 0.52;
      let startY = 380;
      if (featuredRef.current) {
        const fRect = featuredRef.current.getBoundingClientRect();
        startY = fRect.bottom - cRect.top + 20;
        startX = fRect.right - cRect.left - 40;
      }

      // Trunk end: right above pagination or bottom
      let endX = startX;
      let endY = cRect.height - 80;
      if (paginationRef.current) {
        const pRect = paginationRef.current.getBoundingClientRect();
        endY = pRect.top - cRect.top - 15;
        endX = pRect.left + pRect.width / 2 - cRect.left;
      }

      // Left cluster target
      let leftX = cRect.width * 0.25;
      let leftY = startY + 120;
      if (leftClusterRef.current) {
        const lRect = leftClusterRef.current.getBoundingClientRect();
        leftX = lRect.right - cRect.left - 20;
        leftY = lRect.top - cRect.top + 30;
      }

      // Right cluster target
      let rightX = cRect.width * 0.72;
      let rightY = startY + 140;
      if (rightClusterRef.current) {
        const rRect = rightClusterRef.current.getBoundingClientRect();
        rightX = rRect.left - cRect.left + 20;
        rightY = rRect.top - cRect.top + 30;
      }

      setCoords({
        width: Math.max(cRect.width, 300),
        height: Math.max(cRect.height, 600),
        trunkStart: { x: startX, y: startY },
        trunkEnd: { x: endX, y: endY },
        leftTarget: { x: leftX, y: leftY },
        rightTarget: { x: rightX, y: rightY },
      });
    }

    computePoints();

    // Recompute on resize or element layout shifts
    const observer = new ResizeObserver(() => {
      computePoints();
    });

    if (containerRef.current) observer.observe(containerRef.current);
    if (featuredRef.current) observer.observe(featuredRef.current);
    if (leftClusterRef.current) observer.observe(leftClusterRef.current);
    if (rightClusterRef.current) observer.observe(rightClusterRef.current);
    if (paginationRef.current) observer.observe(paginationRef.current);

    window.addEventListener('resize', computePoints);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', computePoints);
    };
  }, [containerRef, featuredRef, leftClusterRef, rightClusterRef, paginationRef]);

  // Generate 6 continuous cubic-bezier strands (NO dotted/dashed base lines!)
  const strands = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      offset: (i - 2.5) * 5.5,
      amp: 14 + i * 3.5,
      phase: i * 0.65,
      opacity: 0.35 + i * 0.11,
      width: i === 2 ? 2.2 : i === 4 ? 1.6 : 1.2,
      color: ['#14B8A6', '#22D3EE', '#5EEAD4'][i % 3],
      hasPulse: i === 1 || i === 3 || i === 4,
      duration: 6.5 + i * 0.8,
    }));
  }, []);

  if (!coords) return null;

  const { width, height, trunkStart, trunkEnd, leftTarget, rightTarget } = coords;

  // Build segmented smooth S-curve path for the main bundle
  function buildTrunkPath(offset: number, amp: number, phase: number) {
    const totalDist = trunkEnd.y - trunkStart.y;
    if (totalDist <= 0) return '';
    const numSegments = Math.max(2, Math.floor(totalDist / 200));
    const segHeight = totalDist / numSegments;

    let d = `M ${trunkStart.x + offset} ${trunkStart.y}`;
    let currY = trunkStart.y;
    let currX = trunkStart.x + offset;

    for (let s = 0; s < numSegments; s++) {
      const nextY = s === numSegments - 1 ? trunkEnd.y : currY + segHeight;
      const targetX = trunkStart.x + (trunkEnd.x - trunkStart.x) * ((s + 1) / numSegments) + offset;
      const direction = (s % 2 === 0 ? 1 : -1) * Math.cos(phase);
      const waveOffset = amp * direction;

      const cp1x = currX + waveOffset;
      const cp1y = currY + segHeight * 0.38;
      const cp2x = targetX - waveOffset * 0.6;
      const cp2y = currY + segHeight * 0.72;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${nextY}`;
      currY = nextY;
      currX = targetX;
    }

    return d;
  }

  // Build smooth cubic-bezier branches
  function buildBranchPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    offset: number,
    isLeft: boolean
  ) {
    const sx = from.x + offset;
    const sy = from.y + 40 + Math.abs(offset) * 2;
    const tx = to.x;
    const ty = to.y + offset;

    const midY = (sy + ty) / 2;
    const curvePull = isLeft ? -Math.abs(sx - tx) * 0.55 : Math.abs(sx - tx) * 0.55;

    const cp1x = sx + curvePull * 0.4;
    const cp1y = sy + (midY - sy) * 0.5;
    const cp2x = tx - curvePull * 0.3;
    const cp2y = ty - 25;

    return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
  }

  // Branch junction point on trunk
  const junctionY = trunkStart.y + Math.min(100, (trunkEnd.y - trunkStart.y) * 0.22);
  const junctionPoint = { x: trunkStart.x, y: junctionY };

  return (
    <div className="wire-bundle-wrapper" aria-hidden="true">
      <svg
        className="wire-bundle-svg"
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle luminescence glow filter */}
          <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for strands */}
          <linearGradient id="wireTealGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#14B8A6" stopOpacity="1" />
            <stop offset="80%" stopColor="#5EEAD4" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="wirePulseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* ─── 1. CENTRAL BUNDLE STRANDS (5-6 Solid Continuous Wires) ─ */}
        {strands.map((strand) => {
          const pathD = buildTrunkPath(strand.offset, strand.amp, strand.phase);
          return (
            <g key={`trunk-${strand.id}`}>
              {/* Main solid continuous strand (NO DASHES) */}
              <path
                d={pathD}
                stroke={strand.color}
                strokeWidth={strand.width}
                strokeOpacity={strand.opacity}
                strokeLinecap="round"
                fill="none"
              />

              {/* Flowing light pulse overlay (ONLY here dash is allowed per spec) */}
              {strand.hasPulse && (
                <path
                  d={pathD}
                  stroke="url(#wirePulseGrad)"
                  strokeWidth={strand.width + 0.6}
                  strokeDasharray="40 420"
                  fill="none"
                  className="wire-flowing-pulse"
                  style={{ animationDuration: `${strand.duration}s` }}
                  filter="url(#wireGlow)"
                />
              )}
            </g>
          );
        })}

        {/* ─── 2. BRANCHES (Curved Bezier mini-bundles to card groups) ─ */}
        {/* Left Branch (3 strands to Left Cluster) */}
        {strands.slice(0, 3).map((strand, idx) => {
          const branchD = buildBranchPath(junctionPoint, leftTarget, strand.offset * 0.8, true);
          return (
            <g key={`branch-l-${idx}`}>
              <path
                d={branchD}
                stroke={strand.color}
                strokeWidth={strand.width}
                strokeOpacity={strand.opacity * 0.9}
                strokeLinecap="round"
                fill="none"
              />
              {idx === 1 && (
                <path
                  d={branchD}
                  stroke="#ffffff"
                  strokeWidth={strand.width + 0.5}
                  strokeDasharray="30 350"
                  fill="none"
                  className="wire-flowing-pulse"
                  style={{ animationDuration: '5.8s' }}
                />
              )}
            </g>
          );
        })}

        {/* Right Branch (3 strands to Right Cluster) */}
        {strands.slice(3, 6).map((strand, idx) => {
          const branchD = buildBranchPath(junctionPoint, rightTarget, strand.offset * 0.8, false);
          return (
            <g key={`branch-r-${idx}`}>
              <path
                d={branchD}
                stroke={strand.color}
                strokeWidth={strand.width}
                strokeOpacity={strand.opacity * 0.9}
                strokeLinecap="round"
                fill="none"
              />
              {idx === 1 && (
                <path
                  d={branchD}
                  stroke="#ffffff"
                  strokeWidth={strand.width + 0.5}
                  strokeDasharray="30 350"
                  fill="none"
                  className="wire-flowing-pulse"
                  style={{ animationDuration: '6.2s' }}
                />
              )}
            </g>
          );
        })}

        {/* ─── 3. NODES ON BUNDLE (28px White Circles with Teal Border) ─ */}
        {/* Top Junction Node */}
        <g transform={`translate(${junctionPoint.x}, ${junctionPoint.y + 12})`}>
          <circle r="14" fill="#ffffff" stroke="#14B8A6" strokeWidth="2" filter="url(#wireGlow)" />
          <circle r="6" fill="#14B8A6" />
          <circle r="3" fill="#ffffff" />
        </g>

        {/* Mid-Spine Node */}
        <g transform={`translate(${trunkStart.x + (trunkEnd.x - trunkStart.x) * 0.55}, ${junctionPoint.y + 240})`}>
          <circle r="12" fill="#ffffff" stroke="#22D3EE" strokeWidth="1.8" />
          <circle r="5" fill="#22D3EE" />
        </g>

        {/* Lower Junction Node */}
        <g transform={`translate(${trunkStart.x + (trunkEnd.x - trunkStart.x) * 0.85}, ${trunkEnd.y - 60})`}>
          <circle r="13" fill="#ffffff" stroke="#14B8A6" strokeWidth="2" />
          <circle r="5.5" fill="#14B8A6" />
        </g>

        {/* ─── 4. RIGHT-EDGE WIRE BUNDLE WITH NODES (Sidebar Edge) ─── */}
        <g className="wire-right-edge-bundle">
          {[-4, 0, 4].map((offset, i) => (
            <path
              key={`edge-${i}`}
              d={`M ${width - 18 + offset} 120 C ${width - 14 + offset} 380, ${width - 22 + offset} 680, ${width - 16 + offset} ${height - 100}`}
              stroke={['#14B8A6', '#22D3EE', '#5EEAD4'][i]}
              strokeWidth={i === 1 ? 1.5 : 1}
              strokeOpacity={0.45}
              fill="none"
            />
          ))}
          {/* Small Node Dots along right edge */}
          <circle cx={width - 18} cy="260" r="4.5" fill="#ffffff" stroke="#14B8A6" strokeWidth="1.5" />
          <circle cx={width - 18} cy="520" r="4.5" fill="#ffffff" stroke="#22D3EE" strokeWidth="1.5" />
          <circle cx={width - 18} cy="780" r="4.5" fill="#ffffff" stroke="#14B8A6" strokeWidth="1.5" />
        </g>
      </svg>

      {/* ─── Tinted Category Capsule Pills on Branches ─────────────── */}
      <div
        className="wire-capsule-badge wire-capsule-badge--left"
        style={{
          left: `${(junctionPoint.x + leftTarget.x) / 2 - 24}px`,
          top: `${(junctionPoint.y + leftTarget.y) / 2 - 12}px`,
        }}
      >
        <span>Video</span>
      </div>

      <div
        className="wire-capsule-badge wire-capsule-badge--right"
        style={{
          left: `${(junctionPoint.x + rightTarget.x) / 2 - 32}px`,
          top: `${(junctionPoint.y + rightTarget.y) / 2 - 12}px`,
        }}
      >
        <span>PDF Tools</span>
      </div>
    </div>
  );
}
