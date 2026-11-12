import React, { useEffect, useState, useMemo } from 'react';

interface WireBundleProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  featuredRef: React.RefObject<HTMLDivElement | null>;
  gutterRef: React.RefObject<HTMLDivElement | null>;
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
  gutterRef,
  leftClusterRef,
  rightClusterRef,
  paginationRef,
}: WireBundleProps) {
  // Initialize with sensible defaults so SVG is immediately visible before ref measurement
  const [coords, setCoords] = useState<Coordinates>({
    width: 1200,
    height: 1450,
    trunkStart: { x: 580, y: 400 },
    trunkEnd: { x: 580, y: 1380 },
    leftTarget: { x: 380, y: 495 },
    rightTarget: { x: 740, y: 515 },
  });

  useEffect(() => {
    function computePoints() {
      if (!containerRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();
      const cWidth = Math.max(cRect.width, 900);
      const cHeight = Math.max(cRect.height, containerRef.current.scrollHeight || 1200);

      // Default trunk start & end: based on gutter channel center if available
      let startX = cWidth * 0.56;
      let startY = 390;

      if (featuredRef.current) {
        const fRect = featuredRef.current.getBoundingClientRect();
        startY = fRect.bottom - cRect.top + 16;
      }

      if (gutterRef.current) {
        const gRect = gutterRef.current.getBoundingClientRect();
        startX = gRect.left + gRect.width / 2 - cRect.left;
      }

      let endX = startX;
      let endY = cHeight - 90;

      if (paginationRef.current) {
        const pRect = paginationRef.current.getBoundingClientRect();
        endY = pRect.top - cRect.top - 12;
        endX = pRect.left + pRect.width / 2 - cRect.left;
      }

      // Left cluster target: curves into top of left cluster
      let leftX = startX - 160;
      let leftY = startY + 80;

      if (leftClusterRef.current) {
        const lRect = leftClusterRef.current.getBoundingClientRect();
        leftX = lRect.left + lRect.width * 0.72 - cRect.left;
        leftY = lRect.top - cRect.top + 8;
      }

      // Right cluster target: curves into top of right cluster
      let rightX = startX + 160;
      let rightY = startY + 95;

      if (rightClusterRef.current) {
        const rRect = rightClusterRef.current.getBoundingClientRect();
        rightX = rRect.left + rRect.width * 0.32 - cRect.left;
        rightY = rRect.top - cRect.top + 8;
      }

      setCoords({
        width: cWidth,
        height: cHeight,
        trunkStart: { x: startX, y: startY },
        trunkEnd: { x: endX, y: endY },
        leftTarget: { x: leftX, y: leftY },
        rightTarget: { x: rightX, y: rightY },
      });
    }

    computePoints();
    const timer1 = setTimeout(computePoints, 80);
    const timer2 = setTimeout(computePoints, 350);

    const observer = new ResizeObserver(() => {
      computePoints();
    });

    if (containerRef.current) observer.observe(containerRef.current);
    if (featuredRef.current) observer.observe(featuredRef.current);
    if (gutterRef.current) observer.observe(gutterRef.current);
    if (leftClusterRef.current) observer.observe(leftClusterRef.current);
    if (rightClusterRef.current) observer.observe(rightClusterRef.current);
    if (paginationRef.current) observer.observe(paginationRef.current);

    window.addEventListener('resize', computePoints);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
      window.removeEventListener('resize', computePoints);
    };
  }, [containerRef, featuredRef, gutterRef, leftClusterRef, rightClusterRef, paginationRef]);

  // 6 continuous cubic-bezier strands (NO dotted/dashed base lines!)
  const strands = useMemo(() => {
    return [
      { id: 0, offset: -12, amp: 14, phase: 0.0, opacity: 0.65, width: 1.8, color: '#14B8A6', hasPulse: false, duration: 7 },
      { id: 1, offset: -6,  amp: 16, phase: 0.6, opacity: 0.85, width: 2.2, color: '#22D3EE', hasPulse: true,  duration: 6.2 },
      { id: 2, offset: -1,  amp: 13, phase: 1.2, opacity: 0.70, width: 2.0, color: '#14B8A6', hasPulse: false, duration: 8 },
      { id: 3, offset: 4,   amp: 17, phase: 1.8, opacity: 0.90, width: 2.4, color: '#5EEAD4', hasPulse: true,  duration: 5.8 },
      { id: 4, offset: 9,   amp: 14, phase: 2.4, opacity: 0.65, width: 1.8, color: '#22D3EE', hasPulse: false, duration: 7.5 },
      { id: 5, offset: 14,  amp: 18, phase: 3.0, opacity: 0.80, width: 2.0, color: '#14B8A6', hasPulse: true,  duration: 6.5 },
    ];
  }, []);

  const { width, height, trunkStart, trunkEnd, leftTarget, rightTarget } = coords;

  // Build segmented smooth S-curve path for the main bundle down the gutter channel
  function buildTrunkPath(offset: number, amp: number, phase: number) {
    const totalDist = trunkEnd.y - trunkStart.y;
    if (totalDist <= 0) return '';
    const numSegments = Math.max(2, Math.floor(totalDist / 220));
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
      const cp1y = currY + segHeight * 0.36;
      const cp2x = targetX - waveOffset * 0.5;
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
    const sy = from.y + 24 + Math.abs(offset) * 1.5;
    const tx = to.x;
    const ty = to.y + offset;

    const midY = (sy + ty) / 2;
    const curvePull = isLeft ? -Math.abs(sx - tx) * 0.5 : Math.abs(sx - tx) * 0.5;

    const cp1x = sx + curvePull * 0.35;
    const cp1y = sy + (midY - sy) * 0.45;
    const cp2x = tx - curvePull * 0.25;
    const cp2y = ty - 28;

    return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
  }

  // Branch junction point on trunk
  const junctionY = trunkStart.y + Math.max(50, (trunkEnd.y - trunkStart.y) * 0.14);
  const junctionPoint = { x: trunkStart.x, y: junctionY };

  return (
    <div className="wire-bundle-wrapper" aria-hidden="true">
      <svg
        className="wire-bundle-svg"
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="wireGlowTeal" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="wirePulseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor="#5EEAD4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* ─── 1. CENTRAL BUNDLE STRANDS (5-6 Solid Continuous Wires in Gutter) ─ */}
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

              {/* Flowing light pulse overlay */}
              {strand.hasPulse && (
                <path
                  d={pathD}
                  stroke="url(#wirePulseGrad)"
                  strokeWidth={strand.width + 0.8}
                  strokeDasharray="45 480"
                  fill="none"
                  className="wire-flowing-pulse"
                  style={{ animationDuration: `${strand.duration}s` }}
                  filter="url(#wireGlowTeal)"
                />
              )}
            </g>
          );
        })}

        {/* ─── 2. BRANCHES (Curved Bezier mini-bundles to card groups) ─ */}
        {/* Left Branch (3 strands to Left 3-Col Cluster) */}
        {strands.slice(0, 3).map((strand, idx) => {
          const branchD = buildBranchPath(junctionPoint, leftTarget, strand.offset * 0.9, true);
          return (
            <g key={`branch-l-${idx}`}>
              <path
                d={branchD}
                stroke={strand.color}
                strokeWidth={strand.width}
                strokeOpacity={strand.opacity}
                strokeLinecap="round"
                fill="none"
              />
              {idx === 1 && (
                <path
                  d={branchD}
                  stroke="#ffffff"
                  strokeWidth={strand.width + 0.6}
                  strokeDasharray="35 380"
                  fill="none"
                  className="wire-flowing-pulse"
                  style={{ animationDuration: '5.5s' }}
                />
              )}
            </g>
          );
        })}

        {/* Right Branch (3 strands to Right Showcase Cluster) */}
        {strands.slice(3, 6).map((strand, idx) => {
          const branchD = buildBranchPath(junctionPoint, rightTarget, strand.offset * 0.9, false);
          return (
            <g key={`branch-r-${idx}`}>
              <path
                d={branchD}
                stroke={strand.color}
                strokeWidth={strand.width}
                strokeOpacity={strand.opacity}
                strokeLinecap="round"
                fill="none"
              />
              {idx === 1 && (
                <path
                  d={branchD}
                  stroke="#ffffff"
                  strokeWidth={strand.width + 0.6}
                  strokeDasharray="35 380"
                  fill="none"
                  className="wire-flowing-pulse"
                  style={{ animationDuration: '6s' }}
                />
              )}
            </g>
          );
        })}

        {/* ─── 3. NODES ON BUNDLE (28px White Circles with Teal Border) ─ */}
        {/* Top Junction Node (28px = r 14) */}
        <g transform={`translate(${junctionPoint.x}, ${junctionPoint.y + 14})`}>
          <circle r="14" fill="#ffffff" stroke="#14B8A6" strokeWidth="2.2" filter="url(#wireGlowTeal)" />
          <circle r="6" fill="#14B8A6" />
          <circle r="2.5" fill="#ffffff" />
        </g>

        {/* Mid-Spine Node (28px = r 14) */}
        <g transform={`translate(${trunkStart.x + (trunkEnd.x - trunkStart.x) * 0.52}, ${junctionPoint.y + 260})`}>
          <circle r="14" fill="#ffffff" stroke="#22D3EE" strokeWidth="2.2" filter="url(#wireGlowTeal)" />
          <circle r="6" fill="#22D3EE" />
          <circle r="2.5" fill="#ffffff" />
        </g>

        {/* Lower Junction Node (28px = r 14) */}
        <g transform={`translate(${trunkStart.x + (trunkEnd.x - trunkStart.x) * 0.86}, ${trunkEnd.y - 40})`}>
          <circle r="14" fill="#ffffff" stroke="#14B8A6" strokeWidth="2.2" filter="url(#wireGlowTeal)" />
          <circle r="6" fill="#14B8A6" />
          <circle r="2.5" fill="#ffffff" />
        </g>

        {/* ─── 4. RIGHT-EDGE WIRE BUNDLE (Outside Sidebar in Right Margin) ─── */}
        <g className="wire-right-edge-bundle">
          {[-4, 0, 4].map((offset, i) => (
            <path
              key={`edge-${i}`}
              d={`M ${width - 8 + offset} 110 C ${width - 4 + offset} 390, ${width - 14 + offset} 720, ${width - 6 + offset} ${height - 80}`}
              stroke={['#14B8A6', '#22D3EE', '#5EEAD4'][i]}
              strokeWidth={i === 1 ? 1.8 : 1.3}
              strokeOpacity={0.65}
              fill="none"
            />
          ))}
          {/* Small Node Dots along right margin */}
          <circle cx={width - 8} cy="240" r="5" fill="#ffffff" stroke="#14B8A6" strokeWidth="1.8" />
          <circle cx={width - 8} cy="540" r="5" fill="#ffffff" stroke="#22D3EE" strokeWidth="1.8" />
          <circle cx={width - 8} cy="820" r="5" fill="#ffffff" stroke="#14B8A6" strokeWidth="1.8" />
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
