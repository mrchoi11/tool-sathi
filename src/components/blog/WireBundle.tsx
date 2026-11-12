import React, { useEffect, useState, useMemo } from 'react';

interface WireBundleProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface Coordinates {
  width: number;
  height: number;
  spineX: number;
  startY: number;
  endY: number;
}

export default function WireBundle({ containerRef }: WireBundleProps) {
  const [coords, setCoords] = useState<Coordinates>({
    width: 900,
    height: 1400,
    spineX: 450,
    startY: 400,
    endY: 1320,
  });

  useEffect(() => {
    function computePoints() {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const w = el.clientWidth || 900;
      const h = el.clientHeight || el.scrollHeight || 1400;

      // Vertical spine is centered in the content wrapper
      const spineX = Math.round(w * 0.50);
      const startY = 405; // directly below the ~380px featured top row
      const endY = Math.max(startY + 400, h - 90); // right above radial pagination

      setCoords({
        width: w,
        height: h,
        spineX,
        startY,
        endY,
      });
    }

    computePoints();
    const t1 = setTimeout(computePoints, 100);
    const t2 = setTimeout(computePoints, 400);

    const observer = new ResizeObserver(() => {
      computePoints();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', computePoints);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      window.removeEventListener('resize', computePoints);
    };
  }, [containerRef]);

  // 6 continuous solid strands in wave bundle (NO DASHES on base lines)
  const strands = useMemo(() => {
    return [
      { id: 0, offset: -12, amp: 14, phase: 0.0, opacity: 0.55, width: 1.6, color: '#14B8A6', hasPulse: false, duration: 7 },
      { id: 1, offset: -6,  amp: 16, phase: 0.7, opacity: 0.85, width: 2.2, color: '#22D3EE', hasPulse: true,  duration: 6.2 },
      { id: 2, offset: -1,  amp: 12, phase: 1.4, opacity: 0.70, width: 1.8, color: '#14B8A6', hasPulse: false, duration: 8 },
      { id: 3, offset: 4,   amp: 17, phase: 2.1, opacity: 0.90, width: 2.4, color: '#5EEAD4', hasPulse: true,  duration: 5.8 },
      { id: 4, offset: 9,   amp: 14, phase: 2.8, opacity: 0.65, width: 1.8, color: '#22D3EE', hasPulse: false, duration: 7.5 },
      { id: 5, offset: 14,  amp: 18, phase: 3.5, opacity: 0.75, width: 2.0, color: '#14B8A6', hasPulse: true,  duration: 6.5 },
    ];
  }, []);

  const { width, height, spineX, startY, endY } = coords;

  // Build segmented smooth S-curve path down the spine
  function buildSpinePath(offset: number, amp: number, phase: number) {
    const totalDist = endY - startY;
    if (totalDist <= 0) return '';
    const numSegments = Math.max(3, Math.floor(totalDist / 220));
    const segHeight = totalDist / numSegments;

    let d = `M ${spineX + offset} ${startY}`;
    let currY = startY;
    let currX = spineX + offset;

    for (let s = 0; s < numSegments; s++) {
      const nextY = s === numSegments - 1 ? endY : currY + segHeight;
      const targetX = spineX + offset;
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

  // Build smooth cubic-bezier branches curving outwards
  function buildBranchPath(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    offset: number,
    isLeft: boolean
  ) {
    const sx = fromX + offset;
    const sy = fromY + 20 + Math.abs(offset);
    const tx = toX;
    const ty = toY + offset * 0.8;

    const midY = (sy + ty) / 2;
    const curvePull = isLeft ? -Math.abs(sx - tx) * 0.45 : Math.abs(sx - tx) * 0.45;

    const cp1x = sx + curvePull * 0.35;
    const cp1y = sy + (midY - sy) * 0.45;
    const cp2x = tx - curvePull * 0.25;
    const cp2y = ty - 24;

    return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
  }

  // Branch junction point on trunk (right below top row)
  const junctionY = startY + 30;
  const leftTargetX = Math.round(width * 0.20);
  const leftTargetY = startY + 85;
  const rightTargetX = Math.round(width * 0.80);
  const rightTargetY = startY + 85;

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

        {/* ─── 1. CENTRAL SPINE BUNDLE (5-6 Solid Continuous Wires Behind Cards) ─ */}
        {strands.map((strand) => {
          const pathD = buildSpinePath(strand.offset, strand.amp, strand.phase);
          return (
            <g key={`trunk-${strand.id}`}>
              {/* Solid continuous strand (NO DASHES) */}
              <path
                d={pathD}
                stroke={strand.color}
                strokeWidth={strand.width}
                strokeOpacity={strand.opacity}
                strokeLinecap="round"
                fill="none"
              />

              {/* Slow flowing light pulse overlay */}
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

        {/* ─── 2. BRANCHES (Curved Bezier mini-bundles to left/right) ─ */}
        {/* Left Branch */}
        {strands.slice(0, 3).map((strand, idx) => {
          const branchD = buildBranchPath(spineX, junctionY, leftTargetX, leftTargetY, strand.offset * 0.8, true);
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

        {/* Right Branch */}
        {strands.slice(3, 6).map((strand, idx) => {
          const branchD = buildBranchPath(spineX, junctionY, rightTargetX, rightTargetY, strand.offset * 0.8, false);
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
        <g transform={`translate(${spineX}, ${junctionY + 12})`}>
          <circle r="14" fill="#ffffff" stroke="#14B8A6" strokeWidth="2.2" filter="url(#wireGlowTeal)" />
          <circle r="6" fill="#14B8A6" />
          <circle r="2.5" fill="#ffffff" />
        </g>

        {/* Mid-Spine Node (28px = r 14) */}
        <g transform={`translate(${spineX}, ${startY + (endY - startY) * 0.48})`}>
          <circle r="14" fill="#ffffff" stroke="#22D3EE" strokeWidth="2.2" filter="url(#wireGlowTeal)" />
          <circle r="6" fill="#22D3EE" />
          <circle r="2.5" fill="#ffffff" />
        </g>

        {/* Lower Node above pagination (28px = r 14) */}
        <g transform={`translate(${spineX}, ${endY - 30})`}>
          <circle r="14" fill="#ffffff" stroke="#14B8A6" strokeWidth="2.2" filter="url(#wireGlowTeal)" />
          <circle r="6" fill="#14B8A6" />
          <circle r="2.5" fill="#ffffff" />
        </g>

        {/* ─── 4. RIGHT-EDGE WIRE BUNDLE (Outside Sidebar in Margin) ─── */}
        <g className="wire-right-edge-bundle">
          {[-4, 0, 4].map((offset, i) => (
            <path
              key={`edge-${i}`}
              d={`M ${width + 16 + offset} 110 C ${width + 20 + offset} 390, ${width + 12 + offset} 720, ${width + 18 + offset} ${height - 80}`}
              stroke={['#14B8A6', '#22D3EE', '#5EEAD4'][i]}
              strokeWidth={i === 1 ? 1.8 : 1.3}
              strokeOpacity={0.65}
              fill="none"
            />
          ))}
          {/* Small Node Dots along right margin */}
          <circle cx={width + 16} cy="240" r="5" fill="#ffffff" stroke="#14B8A6" strokeWidth="1.8" />
          <circle cx={width + 16} cy="540" r="5" fill="#ffffff" stroke="#22D3EE" strokeWidth="1.8" />
          <circle cx={width + 16} cy="820" r="5" fill="#ffffff" stroke="#14B8A6" strokeWidth="1.8" />
        </g>
      </svg>

      {/* ─── Tinted Category Capsule Pills on Branches ─────────────── */}
      <div
        className="wire-capsule-badge wire-capsule-badge--left"
        style={{
          left: `${(spineX + leftTargetX) / 2 - 24}px`,
          top: `${(junctionY + leftTargetY) / 2 - 12}px`,
        }}
      >
        <span>Video</span>
      </div>

      <div
        className="wire-capsule-badge wire-capsule-badge--right"
        style={{
          left: `${(spineX + rightTargetX) / 2 - 32}px`,
          top: `${(junctionY + rightTargetY) / 2 - 12}px`,
        }}
      >
        <span>PDF Tools</span>
      </div>
    </div>
  );
}
