import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Relic } from '@/models/relic';

type NodeKind = 'relic' | 'museum' | 'dynasty' | 'material';

type SimNode = {
  kind: NodeKind;
  key: string;
  label: string;
  relicId?: string;
  isPrimary?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
};

type SimEdge = { source: number; target: number };

const GRAPH_MATERIAL_MAX_CHARS = 30;

/** Normalize API `material` strings for graph nodes only (not displayed elsewhere). */
function extractMaterialKeywordForGraph(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const semi = s.lastIndexOf(';');
  const segment = (semi >= 0 ? s.slice(semi + 1) : s).trim();
  if (!segment) return null;
  if (segment.length > GRAPH_MATERIAL_MAX_CHARS) return null;
  if (materialLooksLikeSentence(segment)) return null;
  return segment.slice(0, GRAPH_MATERIAL_MAX_CHARS);
}

function materialLooksLikeSentence(segment: string): boolean {
  const t = segment.trim();
  if (!t) return true;
  if (/[.!?]\s/.test(t) || /[.!?]$/.test(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 8) return true;
  if (words.length >= 6 && /,/.test(t)) return true;
  if (
    words.length >= 6 &&
    /\b(with|from|featuring|depicting|showing|mounted\s+on|designed\s+for)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

function buildGraph(center: Relic, related: Relic[]): { nodes: SimNode[]; links: SimEdge[] } {
  const ordered: Relic[] = [];
  const seen = new Set<string>();
  ordered.push(center);
  seen.add(center.id);
  for (const r of related) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      ordered.push(r);
    }
  }

  const nodes: SimNode[] = [];
  const idx = new Map<string, number>();

  function addNode(key: string, kind: NodeKind, label: string, opts?: { relicId?: string; isPrimary?: boolean }) {
    let i = idx.get(key);
    if (i !== undefined) return i;
    i = nodes.length;
    idx.set(key, i);
    nodes.push({
      kind,
      key,
      label,
      relicId: opts?.relicId,
      isPrimary: opts?.isPrimary,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    });
    return i;
  }

  for (const r of ordered) {
    addNode(`relic:${r.id}`, 'relic', r.name.trim() || r.id, {
      relicId: r.id,
      isPrimary: r.id === center.id,
    });
  }

  for (const r of ordered) {
    const d = r.dynasty.trim();
    const m = r.museum.trim();
    const matKw = extractMaterialKeywordForGraph(r.material);
    if (d) addNode(`dynasty:${d}`, 'dynasty', d);
    if (m) addNode(`museum:${m}`, 'museum', m);
    if (matKw) addNode(`material:${matKw}`, 'material', matKw);
  }

  const links: SimEdge[] = [];
  for (const r of ordered) {
    const ri = idx.get(`relic:${r.id}`)!;
    const d = r.dynasty.trim();
    const m = r.museum.trim();
    const matKw = extractMaterialKeywordForGraph(r.material);
    if (d) links.push({ source: ri, target: idx.get(`dynasty:${d}`)! });
    if (m) links.push({ source: ri, target: idx.get(`museum:${m}`)! });
    if (matKw) links.push({ source: ri, target: idx.get(`material:${matKw}`)! });
  }

  return { nodes, links };
}

function initPositions(nodes: SimNode[], w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const mobiles = nodes.filter((n) => !n.isPrimary);
  const span = Math.min(w, h) * 0.42;
  mobiles.forEach((n, j) => {
    const angle = (j / Math.max(mobiles.length, 1)) * Math.PI * 2 + 0.37;
    const rad = span * (0.52 + 0.085 * (j % 8)) + Math.random() * span * 0.14;
    n.x = cx + Math.cos(angle) * rad;
    n.y = cy + Math.sin(angle) * rad;
  });
  for (const n of nodes) {
    if (n.isPrimary) {
      n.x = cx;
      n.y = cy;
    }
  }
}

function nodeRank(n: SimNode): number {
  if (n.kind === 'material') return 0;
  if (n.kind === 'dynasty') return 1;
  if (n.kind === 'museum') return 2;
  if (!n.isPrimary) return 3;
  return 4;
}

function nodeRadius(n: SimNode): number {
  if (n.kind !== 'relic') return 11;
  return n.isPrimary ? 22 : 13;
}

function nodeLabelFontSizePx(r: number): number {
  return Math.max(9, Math.min(13.75, r * 0.62));
}

function nodeLabelMaxWidthPx(r: number): number {
  return Math.max(52, Math.min(168, r * 8.2));
}

function truncateLabel(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const trimmed = text.trim() || '—';
  if (maxWidth <= 10) return '…';
  if (ctx.measureText(trimmed).width <= maxWidth) return trimmed;
  const chars = [...trimmed];
  const ellipsis = '…';
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const sub = chars.slice(0, mid).join('') + ellipsis;
    if (ctx.measureText(sub).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  if (lo === 0) return ellipsis;
  return chars.slice(0, lo).join('') + ellipsis;
}

function pickNodeIndex(
  nodes: SimNode[],
  x: number,
  y: number,
  ctxForLabels?: CanvasRenderingContext2D | null,
): number {
  const order = nodes.map((_, i) => i).sort((i, j) => nodeRank(nodes[j]) - nodeRank(nodes[i]));
  for (const i of order) {
    const n = nodes[i];
    const r = nodeRadius(n);
    const hitR = r + 8;
    const dx = x - n.x;
    const dy = y - n.y;
    if (dx * dx + dy * dy <= hitR * hitR) return i;

    if (ctxForLabels) {
      const fontPx = nodeLabelFontSizePx(r);
      const maxW = nodeLabelMaxWidthPx(r);
      ctxForLabels.font = `${fontPx}px Inter, system-ui, sans-serif`;
      const shown = truncateLabel(ctxForLabels, n.label, maxW);
      const tw = ctxForLabels.measureText(shown).width;
      const ty = n.y + r + fontPx * 0.35;
      const padX = 6;
      const padY = 3;
      if (
        x >= n.x - tw / 2 - padX &&
        x <= n.x + tw / 2 + padX &&
        y >= ty - padY &&
        y <= ty + fontPx + padY
      ) {
        return i;
      }
    }
  }
  return -1;
}

function simulate(nodes: SimNode[], links: SimEdge[], w: number, h: number, alpha: number) {
  const cx = w / 2;
  const cy = h / 2;
  const repulsion = 17500;
  const springK = 0.038;
  const ideal = 122;
  const centerK = 0.009;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const distSq = dx * dx + dy * dy + 4;
      const dist = Math.sqrt(distSq);
      const force = repulsion / distSq;
      dx /= dist;
      dy /= dist;
      const fa = force * alpha;
      if (a.fx == null) {
        a.vx -= dx * fa;
        a.vy -= dy * fa;
      }
      if (b.fx == null) {
        b.vx += dx * fa;
        b.vy += dy * fa;
      }
    }
  }

  for (const link of links) {
    const a = nodes[link.source];
    const b = nodes[link.target];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const displacement = dist - ideal;
    const force = displacement * springK * alpha;
    dx /= dist;
    dy /= dist;
    if (a.fx == null) {
      a.vx += dx * force;
      a.vy += dy * force;
    }
    if (b.fx == null) {
      b.vx -= dx * force;
      b.vy -= dy * force;
    }
  }

  const damping = 0.88;
  const pad = 48;

  for (const n of nodes) {
    if (n.fx != null && n.fy != null) {
      n.x = n.fx;
      n.y = n.fy;
      n.vx = 0;
      n.vy = 0;
      continue;
    }
    n.vx += (cx - n.x) * centerK * alpha;
    n.vy += (cy - n.y) * centerK * alpha;

    if (n.x < pad) n.vx += (pad - n.x) * 0.048 * alpha;
    if (n.x > w - pad) n.vx -= (n.x - (w - pad)) * 0.048 * alpha;
    if (n.y < pad) n.vy += (pad - n.y) * 0.048 * alpha;
    if (n.y > h - pad) n.vy -= (n.y - (h - pad)) * 0.048 * alpha;

    n.vx *= damping;
    n.vy *= damping;
    n.x += n.vx;
    n.y += n.vy;
  }
}

function readThemeColor(cssVar: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return raw || '#888888';
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  nodes: SimNode[],
  links: SimEdge[],
  w: number,
  h: number,
  hoverIndex: number,
) {
  const colors = {
    relic: readThemeColor('--relic-knowledge-relic'),
    museum: readThemeColor('--relic-knowledge-museum'),
    dynasty: readThemeColor('--relic-knowledge-dynasty'),
    material: readThemeColor('--relic-knowledge-material'),
    edge: readThemeColor('--relic-knowledge-edge'),
    halo: readThemeColor('--relic-knowledge-halo'),
    stroke: readThemeColor('--relic-border-muted'),
    primaryStroke: readThemeColor('--relic-accent-bright'),
    labelText: readThemeColor('--relic-text'),
    labelOutline: readThemeColor('--relic-page'),
  };

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = colors.edge;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 1;
  for (const e of links) {
    const a = nodes[e.source];
    const b = nodes[e.target];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  const order = nodes.map((_, i) => i).sort((i, j) => nodeRank(nodes[i]) - nodeRank(nodes[j]));

  for (const i of order) {
    const n = nodes[i];
    const fill =
      n.kind === 'relic'
        ? colors.relic
        : n.kind === 'museum'
          ? colors.museum
          : n.kind === 'dynasty'
            ? colors.dynasty
            : colors.material;
    const r = nodeRadius(n);

    if (hoverIndex === i) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
      ctx.fillStyle = colors.halo;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (n.isPrimary && n.kind === 'relic') {
      ctx.strokeStyle = colors.primaryStroke;
      ctx.lineWidth = 3.25;
    } else {
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = n.isPrimary ? 2 : 1.25;
    }
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';

  for (const i of order) {
    const n = nodes[i];
    const r = nodeRadius(n);
    const fontPx = nodeLabelFontSizePx(r);
    const maxW = nodeLabelMaxWidthPx(r);
    ctx.font = `${fontPx}px Inter, system-ui, sans-serif`;
    const line = truncateLabel(ctx, n.label, maxW);
    const ty = n.y + r + fontPx * 0.35;
    const outlineW = Math.max(2.25, fontPx * 0.2);
    ctx.lineWidth = outlineW;
    ctx.strokeStyle = colors.labelOutline;
    ctx.strokeText(line, n.x, ty);
    ctx.fillStyle = colors.labelText;
    ctx.fillText(line, n.x, ty);
  }
}

type Props = {
  centerRelic: Relic;
  related: Relic[];
  onNavigateRelic: (id: string) => void;
};

export function RelicKnowledgeGraph({ centerRelic, related, onNavigateRelic }: Props) {
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<{ nodes: SimNode[]; links: SimEdge[]; w: number; h: number } | null>(null);
  const hoverRef = useRef(-1);
  const dragRef = useRef<{ index: number; moved: boolean; sx: number; sy: number } | null>(null);
  const alphaRef = useRef(1);
  const rafRef = useRef(0);

  const [tooltip, setTooltip] = useState<{
    label: string;
    typeLabel: string;
    px: number;
    py: number;
  } | null>(null);

  const typeLabelFor = useCallback(
    (kind: NodeKind) =>
      kind === 'relic'
        ? t('detailPage.knowledgeGraphTypeRelic')
        : kind === 'museum'
          ? t('detailPage.knowledgeGraphTypeMuseum')
          : kind === 'dynasty'
            ? t('detailPage.knowledgeGraphTypeDynasty')
            : t('detailPage.knowledgeGraphTypeMaterial'),
    [t],
  );

  const resizeAndSync = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    const cssW = Math.max(280, rect.width);
    const cssH = Math.max(520, rect.height);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const st = simRef.current;
    if (!st) return;
    const prevW = st.w;
    const prevH = st.h;
    st.w = cssW;
    st.h = cssH;
    if (prevW <= 1 || prevH <= 1) {
      initPositions(st.nodes, cssW, cssH);
    } else {
      const sx = cssW / prevW;
      const sy = cssH / prevH;
      for (const n of st.nodes) {
        n.x *= sx;
        n.y *= sy;
      }
    }
    alphaRef.current = 1;
  }, []);

  useEffect(() => {
    const { nodes, links } = buildGraph(centerRelic, related);
    simRef.current = { nodes, links, w: 0, h: 0 };
    alphaRef.current = 1;
    resizeAndSync();
  }, [centerRelic, related, resizeAndSync]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ro = new ResizeObserver(() => resizeAndSync());
    ro.observe(wrap);

    const loop = () => {
      const st = simRef.current;
      if (!st || st.w < 10 || st.h < 10) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      alphaRef.current = Math.max(0.045, alphaRef.current * 0.997);
      simulate(st.nodes, st.links, st.w, st.h, alphaRef.current);
      drawFrame(ctx, st.nodes, st.links, st.w, st.h, hoverRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [resizeAndSync]);

  const clientToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const st = simRef.current;
      if (!st) return;
      const { x, y } = clientToCanvas(e.clientX, e.clientY);
      const drag = dragRef.current;
      if (drag != null) {
        const n = st.nodes[drag.index];
        n.fx = x;
        n.fy = y;
        const dx = x - drag.sx;
        const dy = y - drag.sy;
        if (dx * dx + dy * dy > 36) drag.moved = true;
        alphaRef.current = 1;
        setTooltip({
          label: n.label,
          typeLabel: typeLabelFor(n.kind),
          px: x,
          py: y,
        });
        return;
      }

      const hi = pickNodeIndex(st.nodes, x, y, e.currentTarget.getContext('2d'));
      if (hi !== hoverRef.current) {
        hoverRef.current = hi;
        const c =
          hi < 0 ? 'default' : st.nodes[hi].kind === 'relic' ? 'pointer' : 'grab';
        e.currentTarget.style.cursor = c;
      }

      if (hi >= 0) {
        const n = st.nodes[hi];
        setTooltip({
          label: n.label,
          typeLabel: typeLabelFor(n.kind),
          px: x,
          py: y,
        });
      } else {
        setTooltip(null);
      }
    },
    [clientToCanvas, typeLabelFor],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const st = simRef.current;
      if (!st) return;
      const { x, y } = clientToCanvas(e.clientX, e.clientY);
      const i = pickNodeIndex(st.nodes, x, y, e.currentTarget.getContext('2d'));
      if (i < 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.style.cursor = 'grabbing';
      dragRef.current = { index: i, moved: false, sx: x, sy: y };
      const n = st.nodes[i];
      n.fx = x;
      n.fy = y;
      alphaRef.current = 1;
    },
    [clientToCanvas],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const st = simRef.current;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const drag = dragRef.current;
      dragRef.current = null;
      if (!st || drag == null) return;
      const n = st.nodes[drag.index];
      n.fx = null;
      n.fy = null;
      alphaRef.current = 1;
      const { x, y } = clientToCanvas(e.clientX, e.clientY);
      const hi = pickNodeIndex(st.nodes, x, y, e.currentTarget.getContext('2d'));
      hoverRef.current = hi;
      if (!drag.moved && n.kind === 'relic' && n.relicId) {
        onNavigateRelic(n.relicId);
      }
      const cursor =
        hi < 0 ? 'default' : st.nodes[hi].kind === 'relic' ? 'pointer' : 'grab';
      e.currentTarget.style.cursor = cursor;
    },
    [clientToCanvas, onNavigateRelic],
  );

  const onPointerLeave = useCallback(() => {
    if (dragRef.current != null) return;
    hoverRef.current = -1;
    setTooltip(null);
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
  }, []);

  return (
    <section aria-labelledby="relic-knowledge-graph-heading" className="mt-16">
      <h2
        id="relic-knowledge-graph-heading"
        className="mb-3 text-xl text-[var(--relic-text)]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {t('detailPage.knowledgeGraphTitle')}
      </h2>
      <p className="mb-4 text-sm text-[var(--relic-text-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
        {t('detailPage.knowledgeGraphCaption')}
      </p>
      <div
        ref={wrapRef}
        className="relative w-full rounded-2xl border border-[var(--relic-border)] bg-[var(--relic-panel-bg-soft)] overflow-hidden"
        style={{ height: 620 }}
      >
        <canvas
          ref={canvasRef}
          className="block touch-none select-none"
          role="img"
          aria-label={t('detailPage.knowledgeGraphAria')}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          onPointerCancel={onPointerUp}
        />
        {tooltip ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 max-w-[min(280px,85vw)] rounded-lg border px-3 py-2 text-left shadow-lg"
            style={{
              left: Math.min(Math.max(tooltip.px + 14, 8), (wrapRef.current?.clientWidth ?? 400) - 200),
              top: Math.min(Math.max(tooltip.py + 14, 8), (wrapRef.current?.clientHeight ?? 620) - 72),
              background: 'var(--relic-panel-solid)',
              borderColor: 'var(--relic-border-accent)',
              color: 'var(--relic-text)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8125rem',
            }}
          >
            <div className="text-[var(--relic-text-subtle)] text-[0.65rem] uppercase tracking-wide">{tooltip.typeLabel}</div>
            <div className="mt-0.5 leading-snug">{tooltip.label}</div>
          </div>
        ) : null}
      </div>
      <div
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--relic-text-muted)]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: 'var(--relic-knowledge-relic)' }} />
          {t('detailPage.knowledgeGraphLegendRelic')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: 'var(--relic-knowledge-museum)' }} />
          {t('detailPage.knowledgeGraphLegendMuseum')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: 'var(--relic-knowledge-dynasty)' }} />
          {t('detailPage.knowledgeGraphLegendDynasty')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: 'var(--relic-knowledge-material)' }} />
          {t('detailPage.knowledgeGraphLegendMaterial')}
        </span>
      </div>
    </section>
  );
}
