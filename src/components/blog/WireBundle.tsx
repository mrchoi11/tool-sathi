/**
 * WireBundle — Clean Tech Editorial Discovery Wires (Reference Blueprint)
 *
 * Requirements:
 * 1. SPINE: Vertical bundle (5-6 strands, 1.8-2.5px, wave) running in the first
 *    column-gap (between Column 1 and Column 2) from below the top row to pagination.
 * 2. BRANCHES: Each category group (Video, PDF Tools, Tech, Productivity, SEO)
 *    has a smooth branch leaving the spine and travelling through the open horizontal
 *    channel (row-gap / top channel) to that group's first card top-center.
 * 3. NO CARD OVERLAP: Branches run strictly in the channels (at cardTop - 26..38px)
 *    and curve 90° down into the card top node (cardTop - 8px). Wires never cross
 *    over card thumbnails or card text!
 * 4. NODES: 28px circular nodes at spine junctions and card top-centers.
 * 5. PILLS: Category capsule badges ("Video", "PDF Tools", "Tech", "Productivity", "SEO")
 *    centered along the horizontal branch segment.
 * 6. MOBILE (<768px): Only 2 thin wavy strands in the left margin.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';

interface Pt {
  x: number;
  y: number;
}

interface BranchConfig {
  category: string;
  pillLabel: string;
  from: Pt;
  to: Pt;
  channelY: number;
  midPill: Pt;
}

interface WireBundleState {
  width: number;
  height: number;
  spineX: number;
  startY: number;
  endY: number;
  branches: BranchConfig[];
}

interface WireBundleProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cardGridRef: React.RefObject<HTMLDivElement | null>;
}

/* Category Color Tokens matching reference design */
const CATEGORY_META: Record<
  string,
  { label: string; border: string; bg: string; text: string; glow: string }
> = {
  Video: {
    label: 'Video',
    border: '#7c3aed',
    bg: 'rgba(139, 92, 246, 0.12)',
    text: '#7c3aed',
    glow: 'rgba(139, 92, 246, 0.35)',
  },
  PDF: {
    label: 'PDF Tools',
    border: '#2563eb',
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.35)',
  },
  Tech: {
    label: 'Tech',
    border: '#0891b2',
    bg: 'rgba(34, 211, 238, 0.14)',
    text: '#0891b2',
    glow: 'rgba(34, 211, 238, 0.35)',
  },
  Productivity: {
    label: 'Productivity',
    border: '#d97706',
    bg: 'rgba(245, 158, 11, 0.14)',
    text: '#d97706',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
  SEO: {
    label: 'SEO',
    border: '#059669',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#059669',
    glow: 'rgba(16, 185, 129, 0.35)',
  },
};

/* Spine continuous wavy strands */
const STRANDS = [
  { offset: -10, amp: 8, phase: 0.0, opacity: 0.70, width: 2.0, color: '#14B8A6', pulse: false, dur: 7 },
  { offset: -5, amp: 10, phase: 0.6, opacity: 1.00, width: 2.5, color: '#22D3EE', pulse: true, dur: 5.8 },
  { offset: 0, amp: 7, phase: 1.3, opacity: 0.85, width: 2.0, color: '#14B8A6', pulse: false, dur: 8 },
  { offset: 5, amp: 11, phase: 2.0, opacity: 1.00, width: 2.5, color: '#5EEAD4', pulse: true, dur: 6 },
  { offset: 10, amp: 9, phase: 2.7, opacity: 0.75, width: 2.0, color: '#22D3EE', pulse: false, dur: 7.5 },
  { offset: 15, amp: 12, phase: 3.4, opacity: 0.90, width: 2.2, color: '#14B8A6', pulse: true, dur: 6.5 },
];

/* Build smooth wavy spine path */
function buildSpineWave(
  spineX: number,
  startY: number,
  endY: number,
  offset: number,
  amp: number,
  phase: number
): string {
  const totalDist = endY - startY;
  if (totalDist <= 0) return '';
  const numSegs = Math.max(4, Math.floor(totalDist / 180));
  const segHeight = totalDist / numSegs;

  let d = `M ${spineX + offset} ${startY}`;
  let currY = startY;

  for (let s = 0; s < numSegs; s++) {
    const nextY = s === numSegs - 1 ? endY : currY + segHeight;
    const direction = (s % 2 === 0 ? 1 : -1) * Math.cos(phase);
    const waveOffset = amp * direction;

    const cp1x = spineX + offset + waveOffset;
    const cp1y = currY + segHeight * 0.35;
    const cp2x = spineX + offset - waveOffset * 0.5;
    const cp2y = currY + segHeight * 0.72;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${spineX + offset} ${nextY}`;
    currY = nextY;
  }

  return d;
}

/* Build orthogonal smooth 90-degree curved branch path (stays strictly in channels) */
function buildBranchPath(fromX: number, channelY: number, targetX: number, targetY: number, strandOffset = 0): string {
  const y = channelY + strandOffset * 0.6;
  const isLeft = targetX < fromX;
  const r = 16; // smooth corner radius

  if (isLeft) {
    const cornerStartX = Math.max(targetX + r, fromX - 6);
    return `M ${fromX} ${y} L ${cornerStartX} ${y} C ${targetX + r * 0.45} ${y}, ${targetX} ${y + r * 0.45}, ${targetX} ${y + r} L ${targetX} ${targetY}`;
  } else {
    const cornerStartX = Math.min(targetX - r, fromX + 6);
    return `M ${fromX} ${y} L ${cornerStartX} ${y} C ${targetX - r * 0.45} ${y}, ${targetX} ${y + r * 0.45}, ${targetX} ${y + r} L ${targetX} ${targetY}`;
  }
}

export default function WireBundle({ containerRef, cardGridRef }: WireBundleProps) {
  const [state, setState] = useState<WireBundleState>({
    width: 900,
    height: 1400,
    spineX: 340,
    startY: 420,
    endY: 1350,
    branches: [],
  });
  const [isMobile, setIsMobile] = useState(false);

  const compute = useCallback(() => {
    if (!containerRef.current) return;
    const wrap = containerRef.current;
    const wrapBox = wrap.getBoundingClientRect();
    const w = wrap.clientWidth || 900;
    const h = Math.max(wrap.scrollHeight, wrap.clientHeight, 1400);

    const mobile = w < 768;
    setIsMobile(mobile);

    // Compute spine X from actual card grid DOM columns
    let spineX = Math.round(w * 0.355);
    const grid = cardGridRef.current;

    const branches: BranchConfig[] = [];

    if (grid && !mobile) {
      const gridBox = grid.getBoundingClientRect();
      const firstCard = grid.children[0] as HTMLElement | undefined;
      const secondCard = grid.children[1] as HTMLElement | undefined;

      if (firstCard && secondCard) {
        const c1Box = firstCard.getBoundingClientRect();
        const c2Box = secondCard.getBoundingClientRect();
        const gapLeft = c1Box.right - wrapBox.left;
        const gapRight = c2Box.left - wrapBox.left;
        spineX = Math.round((gapLeft + gapRight) / 2);
      }

      // Check categories: Video, PDF, Tech, Productivity, SEO
      const categoriesToFind = ['Video', 'PDF', 'Tech', 'Productivity', 'SEO'];

      categoriesToFind.forEach((cat) => {
        const cardEl = grid.querySelector<HTMLElement>(`[data-category="${cat}"]`);
        if (!cardEl) return;

        const cardBox = cardEl.getBoundingClientRect();
        const targetX = Math.round(cardBox.left - wrapBox.left + cardBox.width / 2);
        const cardTopY = Math.round(cardBox.top - wrapBox.top);

        // Determine if this card is in row 1, 2, etc.
        const gridTop = gridBox.top - wrapBox.top;
        const isRow1 = cardTopY - gridTop < 100;

        // Channel Y: strictly above the card
        let channelY: number;
        if (isRow1) {
          // If Tech (Col 3), elevate slightly so it runs unhindered above PDF (Col 2)
          channelY = cat === 'Tech' ? cardTopY - 38 : cardTopY - 24;
        } else {
          // Midpoint of row gap (56px)
          channelY = cardTopY - 28;
        }

        const targetY = cardTopY - 8; // node right above card top edge
        const meta = CATEGORY_META[cat] || CATEGORY_META.Tech;

        // Midpoint for pill label
        let midPillX = Math.round((spineX + targetX) / 2);
        if (cat === 'Tech') {
          // Position cleanly between Col 2 and Col 3
          midPillX = Math.round(targetX - 70);
        }

        branches.push({
          category: cat,
          pillLabel: meta.label,
          from: { x: spineX, y: channelY },
          to: { x: targetX, y: targetY },
          channelY,
          midPill: { x: midPillX, y: channelY },
        });
      });
    }

    const startY = 430; // below top row and cluster header pill
    const endY = Math.max(startY + 400, h - 90);

    setState({
      width: w,
      height: h,
      spineX,
      startY,
      endY,
      branches,
    });
  }, [containerRef, cardGridRef]);

  useEffect(() => {
    compute();
    const t1 = setTimeout(compute, 100);
    const t2 = setTimeout(compute, 350);
    const t3 = setTimeout(compute, 800);

    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    if (cardGridRef.current) ro.observe(cardGridRef.current);
    window.addEventListener('resize', compute);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [compute, containerRef, cardGridRef]);

  const { width, height, spineX, startY, endY, branches } = state;

  /* Mobile view (<768px): 2 thin wavy strands in left margin only */
  if (isMobile) {
    return (
      <div className="wire-bundle-wrapper" aria-hidden="true">
        <svg
          className="wire-bundle-svg"
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: `${width}px`, height: `${height}px` }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={buildSpineWave(16, startY, endY, 0, 6, 0.4)}
            stroke="#14B8A6"
            strokeWidth={1.5}
            strokeOpacity={0.65}
            fill="none"
          />
          <path
            d={buildSpineWave(22, startY, endY, 0, 8, 1.2)}
            stroke="#22D3EE"
            strokeWidth={1.8}
            strokeOpacity={0.8}
            fill="none"
          />
        </svg>
      </div>
    );
  }

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
          <filter id="wbGlowTeal" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="wbPulseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="55%" stopColor="#5EEAD4" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* ─── 1. SPINE: 5-6 Wavy Strands in First Column Gap Channel ─── */}
        {STRANDS.map((s, i) => {
          const d = buildSpineWave(spineX, startY, endY, s.offset, s.amp, s.phase);
          return (
            <g key={`spine-${i}`}>
              {/* Solid continuous strand (NO DASHES) */}
              <path
                d={d}
                stroke={s.color}
                strokeWidth={s.width}
                strokeOpacity={s.opacity}
                strokeLinecap="round"
                fill="none"
              />

              {/* Flowing light pulse overlay */}
              {s.pulse && (
                <path
                  d={d}
                  stroke="url(#wbPulseGrad)"
                  strokeWidth={s.width + 0.8}
                  strokeDasharray="50 520"
                  strokeDashoffset="0"
                  fill="none"
                  className="wire-flowing-pulse"
                  style={{ animationDuration: `${s.dur}s` }}
                  filter="url(#wbGlowTeal)"
                />
              )}
            </g>
          );
        })}

        {/* ─── 2. BRANCHES: Each Group Connected via Channels ─── */}
        {branches.map((b) => {
          const meta = CATEGORY_META[b.category] || CATEGORY_META.Tech;
          const centerPath = buildBranchPath(b.from.x, b.channelY, b.to.x, b.to.y, 0);

          return (
            <g key={`branch-group-${b.category}`}>
              {/* 3 distinct strands per branch */}
              {[-2.5, 0, 2.5].map((off, idx) => {
                const pathD = buildBranchPath(b.from.x, b.channelY, b.to.x, b.to.y, off);
                const isCenter = idx === 1;
                return (
                  <path
                    key={`b-strand-${idx}`}
                    d={pathD}
                    stroke={isCenter ? meta.border : '#14B8A6'}
                    strokeWidth={isCenter ? 2.2 : 1.5}
                    strokeOpacity={isCenter ? 0.95 : 0.65}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })}

              {/* Subtle flowing light pulse on branch */}
              <path
                d={centerPath}
                stroke="url(#wbPulseGrad)"
                strokeWidth={2.4}
                strokeDasharray="36 320"
                strokeDashoffset="0"
                fill="none"
                className="wire-flowing-pulse"
                style={{ animationDuration: '4.8s' }}
              />

              {/* Node at spine junction (24px = r: 12) */}
              <circle
                cx={b.from.x}
                cy={b.channelY}
                r="11"
                fill="#ffffff"
                stroke={meta.border}
                strokeWidth="2.2"
                filter="url(#wbGlowTeal)"
              />
              <circle cx={b.from.x} cy={b.channelY} r="4.5" fill={meta.border} />
              <circle cx={b.from.x} cy={b.channelY} r="1.8" fill="#ffffff" />

              {/* Node at Card Top Center (24px = r: 11) */}
              <circle
                cx={b.to.x}
                cy={b.to.y}
                r="11"
                fill="#ffffff"
                stroke={meta.border}
                strokeWidth="2.2"
                filter="url(#wbGlowTeal)"
              />
              <circle cx={b.to.x} cy={b.to.y} r="4.5" fill={meta.border} />
              <circle cx={b.to.x} cy={b.to.y} r="1.8" fill="#ffffff" />
            </g>
          );
        })}

        {/* ─── 3. SPINE NODES (3 along the vertical run) ─── */}
        {[0.28, 0.55, 0.82].map((frac, i) => {
          const ny = startY + (endY - startY) * frac;
          const cols = ['#14B8A6', '#22D3EE', '#5EEAD4'];
          return (
            <g key={`snode-${i}`}>
              <circle
                cx={spineX}
                cy={ny}
                r="13"
                fill="#ffffff"
                stroke={cols[i]}
                strokeWidth="2.2"
                filter="url(#wbGlowTeal)"
              />
              <circle cx={spineX} cy={ny} r="5" fill={cols[i]} />
              <circle cx={spineX} cy={ny} r="2" fill="#ffffff" />
            </g>
          );
        })}

        {/* ─── 4. RIGHT-EDGE WIRE BUNDLE (Outside Sidebar in Margin) ─── */}
        {[-4, 0, 4].map((off, i) => (
          <path
            key={`re-${i}`}
            d={`M ${width + 16 + off} 120 C ${width + 22 + off} 420, ${width + 12 + off} 760, ${width + 18 + off} ${height - 80}`}
            stroke={['#14B8A6', '#22D3EE', '#5EEAD4'][i]}
            strokeWidth={i === 1 ? 1.8 : 1.3}
            strokeOpacity={0.65}
            fill="none"
          />
        ))}
        <circle cx={width + 16} cy="260" r="5" fill="#ffffff" stroke="#14B8A6" strokeWidth="1.8" />
        <circle cx={width + 16} cy="580" r="5" fill="#ffffff" stroke="#22D3EE" strokeWidth="1.8" />
        <circle cx={width + 16} cy="880" r="5" fill="#ffffff" stroke="#14B8A6" strokeWidth="1.8" />
      </svg>

      {/* ─── 5. HTML CATEGORY PILL CAPSULES ON BRANCHES (Crisp & Interactive) ─── */}
      {branches.map((b) => {
        const meta = CATEGORY_META[b.category] || CATEGORY_META.Tech;
        return (
          <div
            key={`pill-${b.category}`}
            className="wire-capsule-badge"
            style={{
              left: `${b.midPill.x}px`,
              top: `${b.midPill.y}px`,
              borderColor: meta.border,
              background: '#ffffff',
              color: meta.text,
              boxShadow: `0 2px 10px ${meta.glow}`,
            }}
          >
            <span>{b.pillLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
