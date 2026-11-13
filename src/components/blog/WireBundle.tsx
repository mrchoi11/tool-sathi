/**
 * WireBundle — Fully Dynamic Wire Routing & Category Branches
 *
 * FIXES IMPLEMENTED:
 * 1. RECOMPUTE ON EVERY CHANGE:
 *    - Recomputes on page, category filter, search, posts array, and window/card resize.
 *    - Immediately visible on first mount.
 *    - On page/filter change: fades out stale wires (150ms) -> settles -> computes fresh getBoundingClientRect() -> fades in (250ms).
 * 2. SPINE POSITION & HEIGHT COMPUTED FROM REAL CARD RECTS:
 *    - Spine X = exact center of gutter between Column 1 and Column 2.
 *    - Spine startY = first card row top - 24px (or just below top row on Page 1).
 *    - Spine endY = last card row bottom + 16px. Stops strictly above pagination!
 *    - Short pages (1-4 cards): spine ends immediately 16px below the last card row.
 * 3. RIGHT-EDGE WIRE CONSTRAINED TO SIDEBAR:
 *    - Runs outside the sidebar in the right margin, strictly from sidebar top to sidebar bottom.
 *    - Never overflows into the footer.
 * 4. NODES STRICTLY ON ACTIVE CONNECTIONS:
 *    - Nodes only rendered at spine junctions (where branch leaves) and card top-centers (where branch connects).
 *    - Zero orphaned or floating spine nodes!
 * 5. SINGLE-CATEGORY ROW COMBINING:
 *    - When all cards in a row share the same category, renders a single unified branch with one clean category pill and twigs to cards.
 * 6. RESPONSIVE:
 *    - < 768px (Mobile): 2 subtle wavy strands along left margin from first card to last card.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { BlogPost } from '../../data/blogRegistry';

export interface CategoryStyle {
  label: string;
  border: string;
  bg: string;
  text: string;
  glow: string;
}

export const KNOWN_CATEGORY_STYLES: Record<string, CategoryStyle> = {
  video: {
    label: 'Video',
    border: '#7c3aed',
    bg: 'rgba(139, 92, 246, 0.12)',
    text: '#7c3aed',
    glow: 'rgba(139, 92, 246, 0.35)',
  },
  pdf: {
    label: 'PDF Tools',
    border: '#2563eb',
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.35)',
  },
  'pdf tools': {
    label: 'PDF Tools',
    border: '#2563eb',
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.35)',
  },
  tech: {
    label: 'Tech',
    border: '#0891b2',
    bg: 'rgba(34, 211, 238, 0.14)',
    text: '#0891b2',
    glow: 'rgba(34, 211, 238, 0.35)',
  },
  seo: {
    label: 'SEO',
    border: '#059669',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#059669',
    glow: 'rgba(16, 185, 129, 0.35)',
  },
  productivity: {
    label: 'Productivity',
    border: '#d97706',
    bg: 'rgba(245, 158, 11, 0.14)',
    text: '#d97706',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
};

export function resolveCategoryStyle(categoryName: string): CategoryStyle {
  const norm = (categoryName || 'General').toLowerCase().trim();
  if (KNOWN_CATEGORY_STYLES[norm]) {
    return { ...KNOWN_CATEGORY_STYLES[norm], label: categoryName };
  }

  // Stable deterministic HSL color hashing for custom admin categories
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    label: categoryName,
    border: `hsl(${hue}, 70%, 45%)`,
    bg: `hsla(${hue}, 70%, 50%, 0.12)`,
    text: `hsl(${hue}, 75%, 40%)`,
    glow: `hsla(${hue}, 70%, 50%, 0.35)`,
  };
}

interface BranchLine {
  d: string;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  isCenter: boolean;
}

interface WireNode {
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  fillInner: string;
}

interface CategoryPill {
  id: string;
  label: string;
  x: number;
  y: number;
  border: string;
  text: string;
  glow: string;
}

interface WireBundleState {
  hasCards: boolean;
  width: number;
  height: number;
  spineX: number;
  startY: number;
  endY: number;
  branchLines: BranchLine[];
  nodes: WireNode[];
  pills: CategoryPill[];
  rightWire: {
    x: number;
    y1: number;
    y2: number;
  } | null;
}

export interface WireBundleProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cardGridRef: React.RefObject<HTMLDivElement | null>;
  sidebarRef?: React.RefObject<HTMLElement | null>;
  posts: BlogPost[];
  currentPage: number;
  selectedCategory?: string;
  searchQuery?: string;
  showTopRow?: boolean;
}

/* Continuous wavy strands for spine */
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
  const numSegs = Math.max(3, Math.floor(totalDist / 140));
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

/* Build smooth orthogonal 90-degree curved branch path */
function buildBranchPath(fromX: number, channelY: number, targetX: number, targetY: number, strandOffset = 0): string {
  const y = channelY + strandOffset * 0.6;
  const dist = Math.abs(targetX - fromX);
  if (dist < 8) {
    return `M ${fromX} ${y} L ${targetX} ${targetY}`;
  }

  const isLeft = targetX < fromX;
  const r = Math.min(16, Math.max(4, dist * 0.35));

  if (isLeft) {
    const cornerX = targetX + r;
    return `M ${fromX} ${y} L ${cornerX} ${y} Q ${targetX} ${y} ${targetX} ${y + r} L ${targetX} ${targetY}`;
  } else {
    const cornerX = targetX - r;
    return `M ${fromX} ${y} L ${cornerX} ${y} Q ${targetX} ${y} ${targetX} ${y + r} L ${targetX} ${targetY}`;
  }
}

export default function WireBundle({
  containerRef,
  cardGridRef,
  sidebarRef,
  posts,
  currentPage,
  selectedCategory = 'All',
  searchQuery = '',
  showTopRow = false,
}: WireBundleProps) {
  const [state, setState] = useState<WireBundleState>({
    hasCards: true,
    width: 900,
    height: 1200,
    spineX: 340,
    startY: 420,
    endY: 1100,
    branchLines: [],
    nodes: [],
    pills: [],
    rightWire: null,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const isFirstMount = useRef(true);

  const compute = useCallback(() => {
    if (!containerRef.current) return;
    const wrap = containerRef.current;
    const wrapBox = wrap.getBoundingClientRect();
    const w = wrap.clientWidth || window.innerWidth || 900;

    const mobile = window.innerWidth < 768 || w < 768;
    setIsMobile(mobile);

    const grid = cardGridRef.current;
    if (!grid) return;
    const gridBox = grid.getBoundingClientRect();
    const cardEls = Array.from(grid.children) as HTMLElement[];

    if (cardEls.length === 0) {
      return;
    }

    // Measure cards relative to container wrapper
    interface MeasuredCard {
      el: HTMLElement;
      box: DOMRect;
      left: number;
      right: number;
      top: number;
      bottom: number;
      centerX: number;
      category: string;
    }

    const measuredCards: MeasuredCard[] = cardEls.map((el) => {
      const b = el.getBoundingClientRect();
      const top = Math.round(b.top - wrapBox.top);
      const bottom = Math.round(b.bottom - wrapBox.top);
      const left = Math.round(b.left - wrapBox.left);
      const right = Math.round(b.right - wrapBox.left);
      const centerX = Math.round((left + right) / 2);
      const category = el.getAttribute('data-category')?.trim() || 'General';
      return { el, box: b, left, right, top, bottom, centerX, category };
    });

    // Group cards into rows based on top position
    const rows: MeasuredCard[][] = [];
    measuredCards.forEach((card) => {
      let placed = false;
      for (const row of rows) {
        if (Math.abs(row[0].top - card.top) < 35) {
          row.push(card);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([card]);
      }
    });

    rows.sort((a, b) => a[0].top - b[0].top);
    rows.forEach((row) => row.sort((a, b) => a.left - b.left));

    // ─── 1. SPINE X: Center of gutter between Column 1 and Column 2 ─────────
    let spineX: number;
    const computedStyle = window.getComputedStyle(grid);
    const colGap = parseFloat(computedStyle.columnGap) || 56;
    const gridWidth = gridBox.width;
    const colWidth = (gridWidth - 2 * colGap) / 3;
    const gridLeftRel = Math.round(gridBox.left - wrapBox.left);
    const mathGutterCenter = Math.round(gridLeftRel + colWidth + colGap / 2);

    const row0 = rows[0] || [];
    if (row0.length >= 2) {
      const c0 = row0[0];
      const c1 = row0[1];
      spineX = Math.round((c0.right + c1.left) / 2);
    } else {
      spineX = mathGutterCenter;
    }

    // ─── 2. START Y & END Y: Strictly bounded by cards, never past pagination! ─
    const firstRowTop = rows[0][0].top;
    const lastRow = rows[rows.length - 1];
    const lastRowBottom = Math.max(...lastRow.map((c) => c.bottom));

    let startY: number;
    if (showTopRow) {
      const relGridTop = Math.round(gridBox.top - wrapBox.top);
      startY = Math.max(160, relGridTop - 48);
    } else {
      startY = Math.max(16, Math.round(firstRowTop - 24));
    }

    // Spine END Y: exactly 16px below the last card row (stops well before pagination!)
    const endY = Math.round(lastRowBottom + 16);

    // ─── 3. DYNAMIC BRANCHES & NODES (ZERO FLOATING / ORPHANED NODES) ───────
    const branchLines: BranchLine[] = [];
    const nodes: WireNode[] = [];
    const pills: CategoryPill[] = [];

    if (!mobile) {
      rows.forEach((rowCards, rowIndex) => {
        const rowTop = Math.min(...rowCards.map((c) => c.top));
        const channelY = Math.round(rowTop - 24);

        const firstCategory = rowCards[0].category.toLowerCase();
        const isSingleCategory = rowCards.every((c) => c.category.toLowerCase() === firstCategory);

        if (isSingleCategory) {
          const cat = rowCards[0].category;
          const style = resolveCategoryStyle(cat);

          // Junction node at spine
          nodes.push({
            cx: spineX,
            cy: channelY,
            r: 10,
            stroke: style.border,
            fillInner: style.border,
          });

          const leftCards = rowCards.filter((c) => c.centerX < spineX);
          const rightCards = rowCards.filter((c) => c.centerX >= spineX);

          // Connect Left Cards
          leftCards.forEach((c) => {
            const targetY = c.top - 8;
            [-2.2, 0, 2.2].forEach((off, sIdx) => {
              branchLines.push({
                d: buildBranchPath(spineX, channelY, c.centerX, targetY, off),
                stroke: sIdx === 1 ? style.border : '#14B8A6',
                strokeWidth: sIdx === 1 ? 2.2 : 1.4,
                strokeOpacity: sIdx === 1 ? 0.95 : 0.65,
                isCenter: sIdx === 1,
              });
            });
            nodes.push({
              cx: c.centerX,
              cy: targetY,
              r: 10,
              stroke: style.border,
              fillInner: style.border,
            });
          });

          // Connect Right Cards
          rightCards.forEach((c, rIdx) => {
            const targetY = c.top - 8;
            const isPrimary = rIdx === 0;

            if (isPrimary) {
              [-2.2, 0, 2.2].forEach((off, sIdx) => {
                branchLines.push({
                  d: buildBranchPath(spineX, channelY, c.centerX, targetY, off),
                  stroke: sIdx === 1 ? style.border : '#14B8A6',
                  strokeWidth: sIdx === 1 ? 2.2 : 1.4,
                  strokeOpacity: sIdx === 1 ? 0.95 : 0.65,
                  isCenter: sIdx === 1,
                });
              });
            } else {
              branchLines.push({
                d: buildBranchPath(spineX, channelY, c.centerX, targetY, 0),
                stroke: style.border,
                strokeWidth: 1.8,
                strokeOpacity: 0.8,
                isCenter: false,
              });
            }

            nodes.push({
              cx: c.centerX,
              cy: targetY,
              r: 10,
              stroke: style.border,
              fillInner: style.border,
            });
          });

          // Category Pill position
          let pillX: number;
          if (rightCards.length > 0) {
            pillX = Math.round((spineX + rightCards[0].centerX) / 2);
          } else if (leftCards.length > 0) {
            pillX = Math.round((spineX + leftCards[0].centerX) / 2);
          } else {
            pillX = spineX;
          }

          pills.push({
            id: `row-${rowIndex}-${cat}`,
            label: style.label,
            x: pillX,
            y: channelY,
            border: style.border,
            text: style.text,
            glow: style.glow,
          });
        } else {
          // Multiple categories in this row
          const catMap = new Map<string, MeasuredCard[]>();
          rowCards.forEach((c) => {
            if (!catMap.has(c.category)) catMap.set(c.category, []);
            catMap.get(c.category)!.push(c);
          });

          let catIdx = 0;
          catMap.forEach((cardsInCat, cat) => {
            const style = resolveCategoryStyle(cat);
            const primaryCard = cardsInCat[0];
            const isCol2 = primaryCard.centerX > spineX + colWidth;
            const branchY = isCol2 ? channelY - 12 : channelY;

            // Junction node at spine
            nodes.push({
              cx: spineX,
              cy: branchY,
              r: 10,
              stroke: style.border,
              fillInner: style.border,
            });

            cardsInCat.forEach((c, idx) => {
              const targetY = c.top - 8;
              const isMain = idx === 0;

              if (isMain) {
                [-2.2, 0, 2.2].forEach((off, sIdx) => {
                  branchLines.push({
                    d: buildBranchPath(spineX, branchY, c.centerX, targetY, off),
                    stroke: sIdx === 1 ? style.border : '#14B8A6',
                    strokeWidth: sIdx === 1 ? 2.2 : 1.4,
                    strokeOpacity: sIdx === 1 ? 0.95 : 0.65,
                    isCenter: sIdx === 1,
                  });
                });
              } else {
                branchLines.push({
                  d: buildBranchPath(spineX, branchY, c.centerX, targetY, 0),
                  stroke: style.border,
                  strokeWidth: 1.8,
                  strokeOpacity: 0.8,
                  isCenter: false,
                });
              }

              nodes.push({
                cx: c.centerX,
                cy: targetY,
                r: 10,
                stroke: style.border,
                fillInner: style.border,
              });
            });

            let pillX = Math.round((spineX + primaryCard.centerX) / 2);
            if (isCol2) {
              pillX = Math.round(primaryCard.centerX - 60);
            }

            pills.push({
              id: `row-${rowIndex}-${cat}-${catIdx}`,
              label: style.label,
              x: pillX,
              y: branchY,
              border: style.border,
              text: style.text,
              glow: style.glow,
            });

            catIdx++;
          });
        }
      });
    }

    // ─── 4. RIGHT-EDGE WIRE: STRICTLY CONSTRAINED TO SIDEBAR (FOOTER MEIN NAHI) ─
    let rightWire: { x: number; y1: number; y2: number } | null = null;
    if (sidebarRef && sidebarRef.current && w >= 1100) {
      const sideEl = sidebarRef.current;
      const sideBox = sideEl.getBoundingClientRect();
      const sideRightRel = Math.round(sideBox.right - wrapBox.left);
      const sideTopRel = Math.round(sideBox.top - wrapBox.top);
      const sideBottomRel = Math.round(sideBox.bottom - wrapBox.top);

      rightWire = {
        x: sideRightRel + 14,
        y1: Math.max(16, sideTopRel + 16),
        y2: sideBottomRel,
      };
    }

    const totalHeight = Math.max(endY + 30, rightWire ? rightWire.y2 + 20 : endY + 30);
    const totalWidth = Math.max(w + 30, rightWire ? rightWire.x + 20 : w);

    setState({
      hasCards: true,
      width: totalWidth,
      height: totalHeight,
      spineX,
      startY,
      endY,
      branchLines,
      nodes,
      pills,
      rightWire,
    });
  }, [containerRef, cardGridRef, sidebarRef, showTopRow]);

  const depsKey = `${currentPage}-${selectedCategory}-${searchQuery}-${posts.map((p) => p.id).join(',')}-${showTopRow}`;

  // Initial mount: compute immediately
  useEffect(() => {
    compute();
    const t1 = setTimeout(compute, 60);
    const t2 = setTimeout(compute, 200);
    const t3 = setTimeout(compute, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [compute]);

  // Page / Filter change: fade out (150ms), recompute fresh rects, fade in (250ms)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setIsVisible(false);

    const t1 = setTimeout(() => {
      compute();
      setIsVisible(true);
    }, 150);

    const t2 = setTimeout(() => {
      compute();
    }, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [depsKey, compute]);

  // Window resize & ResizeObserver listeners
  useEffect(() => {
    const handleResize = () => compute();
    window.addEventListener('resize', handleResize);

    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    if (cardGridRef.current) ro.observe(cardGridRef.current);
    if (sidebarRef?.current) ro.observe(sidebarRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [compute, containerRef, cardGridRef, sidebarRef]);

  const { hasCards, width, height, spineX, startY, endY, branchLines, nodes, pills, rightWire } = state;

  if (!hasCards) return null;

  /* Mobile view (<768px): 2 thin wavy strands in left margin strictly within card height */
  if (isMobile) {
    return (
      <div
        className="wire-bundle-wrapper"
        aria-hidden="true"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      >
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
    <div
      className="wire-bundle-wrapper"
      aria-hidden="true"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 220ms ease',
      }}
    >
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

        {/* ─── 1. SPINE: 5-6 Wavy Strands strictly bounded between startY and endY ─── */}
        {STRANDS.map((s, i) => {
          const d = buildSpineWave(spineX, startY, endY, s.offset, s.amp, s.phase);
          return (
            <g key={`spine-${i}`}>
              <path
                d={d}
                stroke={s.color}
                strokeWidth={s.width}
                strokeOpacity={s.opacity}
                strokeLinecap="round"
                fill="none"
              />

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

        {/* ─── 2. DYNAMIC BRANCHES & TWIGS ─── */}
        {branchLines.map((b, idx) => (
          <React.Fragment key={`branch-${idx}`}>
            <path
              d={b.d}
              stroke={b.stroke}
              strokeWidth={b.strokeWidth}
              strokeOpacity={b.strokeOpacity}
              strokeLinecap="round"
              fill="none"
            />
            {b.isCenter && (
              <path
                d={b.d}
                stroke="url(#wbPulseGrad)"
                strokeWidth={2.4}
                strokeDasharray="36 320"
                strokeDashoffset="0"
                fill="none"
                className="wire-flowing-pulse"
                style={{ animationDuration: '4.8s' }}
              />
            )}
          </React.Fragment>
        ))}

        {/* ─── 3. ACTIVE CONNECTION NODES (ONLY AT JUNCTIONS & CARDS) ─── */}
        {nodes.map((node, idx) => (
          <g key={`node-${idx}`}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="#ffffff"
              stroke={node.stroke}
              strokeWidth="2.2"
              filter="url(#wbGlowTeal)"
            />
            <circle cx={node.cx} cy={node.cy} r={node.r * 0.45} fill={node.fillInner} />
            <circle cx={node.cx} cy={node.cy} r={node.r * 0.18} fill="#ffffff" />
          </g>
        ))}

        {/* ─── 4. RIGHT-EDGE WIRE BUNDLE (CONSTRAINED STRICTLY TO SIDEBAR) ─── */}
        {rightWire && (
          <g key="right-edge-bundle">
            {[-3, 0, 3].map((off, i) => {
              const x = rightWire.x + off;
              const y1 = rightWire.y1;
              const y2 = rightWire.y2;
              const d = `M ${x} ${y1} C ${x + 6} ${y1 + (y2 - y1) * 0.3}, ${x - 4} ${y1 + (y2 - y1) * 0.7}, ${x} ${y2}`;
              return (
                <path
                  key={`re-${i}`}
                  d={d}
                  stroke={['#14B8A6', '#22D3EE', '#5EEAD4'][i]}
                  strokeWidth={i === 1 ? 1.8 : 1.3}
                  strokeOpacity={0.65}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
            <circle
              cx={rightWire.x}
              cy={rightWire.y1 + (rightWire.y2 - rightWire.y1) * 0.3}
              r="4.5"
              fill="#ffffff"
              stroke="#14B8A6"
              strokeWidth="1.8"
            />
            <circle
              cx={rightWire.x}
              cy={rightWire.y1 + (rightWire.y2 - rightWire.y1) * 0.7}
              r="4.5"
              fill="#ffffff"
              stroke="#22D3EE"
              strokeWidth="1.8"
            />
          </g>
        )}
      </svg>

      {/* ─── 5. DYNAMIC HTML CATEGORY PILLS ON BRANCHES ─── */}
      {pills.map((p) => (
        <div
          key={p.id}
          className="wire-capsule-badge"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            borderColor: p.border,
            background: '#ffffff',
            color: p.text,
            boxShadow: `0 2px 10px ${p.glow}`,
          }}
        >
          <span>{p.label}</span>
        </div>
      ))}
    </div>
  );
}
