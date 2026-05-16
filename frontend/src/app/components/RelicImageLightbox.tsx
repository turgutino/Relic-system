import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function clampPan(
  px: number,
  py: number,
  dispW: number,
  dispH: number,
  vpW: number,
  vpH: number,
): { x: number; y: number } {
  const halfExcessX = Math.max(0, (dispW - vpW) / 2);
  const halfExcessY = Math.max(0, (dispH - vpH) / 2);
  return {
    x: clamp(px, -halfExcessX, halfExcessX),
    y: clamp(py, -halfExcessY, halfExcessY),
  };
}

type Props = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

export function RelicImageLightbox({ open, src, alt, onClose }: Props) {
  const { t } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [vpSize, setVpSize] = useState({ w: 0, h: 0 });
  const [zoomMul, setZoomMul] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef<{ panX: number; panY: number; cx: number; cy: number } | null>(null);
  const stateRef = useRef({
    zoomMul: 1,
    pan: { x: 0, y: 0 },
    fitScale: 0,
    natural: null as { w: number; h: number } | null,
    vpSize: { w: 0, h: 0 },
  });

  const fitScale =
    natural && vpSize.w > 0 && vpSize.h > 0 && natural.w > 0 && natural.h > 0
      ? Math.min((vpSize.w - 40) / natural.w, (vpSize.h - 40) / natural.h)
      : 0;

  stateRef.current = { zoomMul, pan, fitScale, natural, vpSize };

  useEffect(() => {
    if (!open) return;
    setZoomMul(1);
    setPan({ x: 0, y: 0 });
    setNatural(null);
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setVpSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (!el) return;

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0018);
      setZoomMul((z) => clamp(z * factor, 1, 8));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (!el) return;

    let mode: 'none' | 'pan' | 'pinch' = 'none';
    let lastPinchDist = 0;
    let panStart = { panX: 0, panY: 0, cx: 0, cy: 0 };

    const touchDist = (tl: TouchList) => {
      if (tl.length < 2) return 0;
      const dx = tl[0].clientX - tl[1].clientX;
      const dy = tl[0].clientY - tl[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        mode = 'pinch';
        lastPinchDist = touchDist(e.touches);
      } else if (e.touches.length === 1 && stateRef.current.zoomMul > 1) {
        mode = 'pan';
        panStart = {
          panX: stateRef.current.pan.x,
          panY: stateRef.current.pan.y,
          cx: e.touches[0].clientX,
          cy: e.touches[0].clientY,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const st = stateRef.current;
      if (!st.natural || st.fitScale <= 0) return;

      if (mode === 'pinch' && e.touches.length >= 2) {
        e.preventDefault();
        const d = touchDist(e.touches);
        if (lastPinchDist > 1e-6) {
          const ratio = d / lastPinchDist;
          setZoomMul((z) => clamp(z * ratio, 1, 8));
        }
        lastPinchDist = d;
      } else if (mode === 'pan' && e.touches.length === 1 && st.zoomMul > 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - panStart.cx;
        const dy = touch.clientY - panStart.cy;
        const dispW = st.natural.w * st.fitScale * st.zoomMul;
        const dispH = st.natural.h * st.fitScale * st.zoomMul;
        setPan(clampPan(panStart.panX + dx, panStart.panY + dy, dispW, dispH, st.vpSize.w, st.vpSize.h));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        mode = 'none';
        lastPinchDist = 0;
      } else if (e.touches.length === 1 && mode === 'pinch') {
        mode = 'none';
        lastPinchDist = 0;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [open]);

  useEffect(() => {
    if (zoomMul <= 1.001) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoomMul]);

  useEffect(() => {
    if (!natural || fitScale <= 0 || !vpSize.w) return;
    const dispW = natural.w * fitScale * zoomMul;
    const dispH = natural.h * fitScale * zoomMul;
    setPan((p) => {
      const n = clampPan(p.x, p.y, dispW, dispH, vpSize.w, vpSize.h);
      if (n.x === p.x && n.y === p.y) return p;
      return n;
    });
  }, [natural, fitScale, zoomMul, vpSize.w, vpSize.h]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;
    const z = stateRef.current.zoomMul;
    if (z <= 1) return;
    dragRef.current = {
      panX: stateRef.current.pan.x,
      panY: stateRef.current.pan.y,
      cx: e.clientX,
      cy: e.clientY,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const d = dragRef.current;
    if (!d) return;
    const st = stateRef.current;
    if (!st.natural || st.fitScale <= 0) return;
    const dx = e.clientX - d.cx;
    const dy = e.clientY - d.cy;
    const dispW = st.natural.w * st.fitScale * st.zoomMul;
    const dispH = st.natural.h * st.fitScale * st.zoomMul;
    setPan(clampPan(d.panX + dx, d.panY + dy, dispW, dispH, st.vpSize.w, st.vpSize.h));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onDoubleClickReset = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setZoomMul(1);
    setPan({ x: 0, y: 0 });
  }, []);

  if (!open) return null;

  const dispW = natural && fitScale > 0 ? natural.w * fitScale * zoomMul : undefined;
  const dispH = natural && fitScale > 0 ? natural.h * fitScale * zoomMul : undefined;

  const grabCursor = zoomMul > 1 ? (dragging ? 'grabbing' : 'grab') : 'default';

  return (
    <div
      role="dialog"
      aria-modal
      aria-label={t('detailPage.lightboxAria')}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-[1px]"
    >
      <div className="relative z-[1] flex shrink-0 items-center justify-between gap-4 px-4 py-3 md:px-5">
        <div
          className="min-w-0 rounded-full bg-[var(--relic-panel-solid)] px-4 py-1.5 text-sm tabular-nums text-[var(--relic-text)] shadow-md ring-1 ring-[var(--relic-border-muted)]"
          aria-live="polite"
        >
          {t('detailPage.lightboxZoomLevel', { pct: Math.round(zoomMul * 100) })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--relic-panel-solid)] text-[var(--relic-text)] shadow-md ring-1 ring-[var(--relic-border-muted)] transition-colors hover:bg-[var(--relic-accent-muted-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--relic-accent-bright)]"
          aria-label={t('detailPage.lightboxCloseAria')}
        >
          <X size={22} strokeWidth={2} />
        </button>
      </div>

      <div
        ref={viewportRef}
        className="relative z-[1] min-h-0 flex-1 overflow-hidden touch-none select-none"
        style={{ cursor: grabCursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex h-full w-full items-center justify-center p-4">
          <div className="relative inline-block max-h-full max-w-full outline-none" onDoubleClick={onDoubleClickReset}>
            <img
              key={src}
              src={src}
              alt={alt}
              draggable={false}
              onLoad={onImgLoad}
              className="pointer-events-none block select-none"
              style={{
                width: dispW ? `${dispW}px` : 'auto',
                height: dispH ? `${dispH}px` : 'auto',
                maxHeight: natural ? undefined : '85vh',
                maxWidth: natural ? undefined : '95vw',
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transition: dragging ? 'none' : 'transform 75ms ease-out',
              }}
            />
          </div>
        </div>
      </div>

      <p className="relative z-[1] shrink-0 px-4 pb-4 pt-1 text-center text-xs text-white/75 md:text-sm">
        {t('detailPage.lightboxHint')}
      </p>
    </div>
  );
}
