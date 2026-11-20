"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import { Maximize2, Minimize2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn, countryName, numericToAlpha2 } from "@/lib/utils";
import { CountrySearch } from "./CountrySearch";

const W = 1000;
const H = 520;
const MIN_K = 1;
const MAX_K = 14;

export type MapCountry = {
  code: string | null; // null = not selectable (disputed / unmapped)
  name: string;
  d: string;
  cx: number;
  cy: number;
  bounds: [[number, number], [number, number]];
  area: number;
};

/* ---------- data loading (cached across mounts) ---------- */

let cache: Promise<MapCountry[]> | null = null;

function loadCountries(): Promise<MapCountry[]> {
  if (cache) return cache;
  cache = fetch("/geo/countries-50m.json", { mode: "cors", credentials: "same-origin" })
    .then((r) => r.json())
    .then((topo: Topology<{ countries: GeometryCollection<{ name: string }> }>) => {
      const fc = feature(topo, topo.objects.countries) as unknown as { features: Feature<Geometry, { name: string }>[] };
      const features = fc.features.filter((f) => f.id !== "010"); // drop Antarctica
      const projection = geoNaturalEarth1().fitExtent(
        [
          [8, 8],
          [W - 8, H - 8],
        ],
        { type: "FeatureCollection", features } as never,
      );
      const path = geoPath(projection);
      return features.map((f) => {
        let code = numericToAlpha2(f.id as string) ?? null;
        if (!code && f.properties.name === "Kosovo") code = "XK";
        const [cx, cy] = path.centroid(f);
        return {
          code,
          name: code ? countryName(code) : f.properties.name,
          d: path(f) ?? "",
          cx,
          cy,
          bounds: path.bounds(f) as [[number, number], [number, number]],
          area: path.area(f),
        };
      });
    })
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}

export function useMapCountries() {
  const [data, setData] = useState<MapCountry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    loadCountries()
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);
  return { data, error };
}

/* ---------- paths layer (memoised: hover never re-renders 240 paths) ---------- */

const CountryPaths = memo(function CountryPaths({
  countries,
  selected,
  researched,
  onEnter,
  onLeave,
  onClick,
}: {
  countries: MapCountry[];
  selected?: string | null;
  researched: Set<string>;
  onEnter: (c: MapCountry) => void;
  onLeave: () => void;
  onClick: (c: MapCountry) => void;
}) {
  return (
    <>
      {countries.map((c, i) => (
        <path
          key={`${c.code ?? "x"}-${i}`}
          d={c.d}
          className={cn(
            "country",
            !c.code && "inert",
            c.code && researched.has(c.code) && "researched",
            c.code && c.code === selected && "selected",
          )}
          onMouseEnter={() => onEnter(c)}
          onMouseLeave={onLeave}
          onClick={() => onClick(c)}
        />
      ))}
    </>
  );
});

/* ---------- component ---------- */

type View = { k: number; x: number; y: number };
const IDENTITY: View = { k: 1, x: 0, y: 0 };

function clampView(v: View): View {
  const k = Math.min(MAX_K, Math.max(MIN_K, v.k));
  const x = Math.min(0, Math.max(W - W * k, v.x));
  const y = Math.min(0, Math.max(H - H * k, v.y));
  return { k, x, y };
}

export function WorldMap({
  researched,
  selected,
  onSelect,
  describe,
  focus,
  wheel = "modifier",
  showSearch = true,
  className,
  fill = false,
}: {
  researched: Set<string>;
  selected?: string | null;
  onSelect: (code: string) => void;
  describe?: (code: string) => string;
  /** Country code to zoom to when it changes. */
  focus?: string | null;
  /** "always": wheel zooms. "modifier": requires Ctrl/⌘ (so page scroll keeps working). */
  wheel?: "always" | "modifier";
  showSearch?: boolean;
  className?: string;
  /** Fill parent height instead of keeping the map's aspect ratio. */
  fill?: boolean;
}) {
  const { data, error } = useMapCountries();
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(IDENTITY);
  const [animate, setAnimate] = useState(false);
  const [hover, setHover] = useState<{ c: MapCountry; x: number; y: number; w?: number } | null>(null);
  const [hint, setHint] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fullscreenRef = useRef(false);
  useEffect(() => {
    fullscreenRef.current = fullscreen;
  }, [fullscreen]);

  // Full-screen map: Esc exits, page behind doesn't scroll
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);
  const drag = useRef<{ moved: boolean; pointers: Map<number, { x: number; y: number }>; last?: { x: number; y: number }; dist?: number }>({
    moved: false,
    pointers: new Map(),
  });

  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const zoomAt = useCallback((factor: number, px: number, py: number, smooth = false) => {
    setAnimate(smooth);
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      const f = k / v.k;
      return clampView({ k, x: px - (px - v.x) * f, y: py - (py - v.y) * f });
    });
  }, []);

  const zoomToCountry = useCallback(
    (code: string) => {
      const c = data?.find((x) => x.code === code);
      if (!c) return;
      const [[x0, y0], [x1, y1]] = c.bounds;
      const dx = Math.max(x1 - x0, 1);
      const dy = Math.max(y1 - y0, 1);
      // Very wide shapes (Russia, USA incl. Alaska, Fiji) — keep them comfortable
      const k = Math.min(6, Math.max(1, 0.45 / Math.max(dx / W, dy / H)));
      const cx = dx > W * 0.6 ? c.cx : (x0 + x1) / 2;
      const cy = dx > W * 0.6 ? c.cy : (y0 + y1) / 2;
      setAnimate(true);
      setView(clampView({ k, x: W / 2 - k * cx, y: H / 2 - k * cy }));
    },
    [data],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (focus && data) zoomToCountry(focus);
  }, [focus, data, zoomToCountry]);

  // Wheel zoom (non-passive so we can prevent page scroll when zooming)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let hintTimer: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      if (wheel === "modifier" && !fullscreenRef.current && !(e.ctrlKey || e.metaKey)) {
        setHint(true);
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => setHint(false), 1200);
        return;
      }
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * 0.0022), p.x, p.y);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(hintTimer);
    };
  }, [wheel, toSvg, zoomAt, fullscreen, data]);

  /* pointer: drag to pan, two fingers to pinch */
  const onPointerDown = (e: React.PointerEvent) => {
    const d = drag.current;
    d.pointers.set(e.pointerId, toSvg(e.clientX, e.clientY));
    d.moved = false;
    d.last = toSvg(e.clientX, e.clientY);
    d.dist = undefined;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.pointers.has(e.pointerId)) {
      // plain hover → tooltip position
      if (wrapRef.current) {
        const r = wrapRef.current.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        setHover((h) => (h ? { ...h, x, y, w: r.width } : h));
      }
      return;
    }
    const p = toSvg(e.clientX, e.clientY);
    d.pointers.set(e.pointerId, p);
    if (d.pointers.size === 2) {
      const [a, b] = [...d.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (d.dist) zoomAt(dist / d.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
      d.dist = dist;
      d.moved = true;
      return;
    }
    if (!d.last) return;
    // compare in client pixels-ish space: svg units scale with view; use raw svg delta
    const dx = p.x - d.last.x;
    const dy = p.y - d.last.y;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    if (!d.moved) (e.currentTarget as Element).setPointerCapture(e.pointerId);
    d.moved = true;
    setAnimate(false);
    setHover(null);
    setView((v) => clampView({ ...v, x: v.x + dx, y: v.y + dy }));
    d.last = p;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    d.pointers.delete(e.pointerId);
    d.dist = undefined;
    if (d.pointers.size === 1) d.last = [...d.pointers.values()][0];
  };

  const onEnter = useCallback(
    (c: MapCountry) => {
      if (drag.current.pointers.size) return;
      setHover((h) => ({ c, x: h?.x ?? 0, y: h?.y ?? 0 }));
    },
    [],
  );
  const onLeave = useCallback(() => setHover(null), []);
  const onClick = useCallback(
    (c: MapCountry) => {
      if (drag.current.moved || !c.code) return;
      onSelect(c.code);
    },
    [onSelect],
  );

  // Researched indicator dots, size kept constant in screen space
  const dots = useMemo(() => (data ? data.filter((c) => c.code && researched.has(c.code)) : []), [data, researched]);
  // Tiny countries get a hit target so they remain clickable at world zoom
  const tiny = useMemo(() => (data ? data.filter((c) => c.code && c.area < 4) : []), [data]);

  const searchable = useMemo(
    () => (data ? data.filter((c) => c.code).map((c) => ({ code: c.code!, name: c.name })) : []),
    [data],
  );

  const node = (
    <div
      ref={wrapRef}
      className={cn(
        "group/map select-none overflow-hidden bg-[var(--map-ocean)]",
        fullscreen
          ? "fixed inset-0 z-50 pb-[env(safe-area-inset-bottom)]"
          : cn("relative rounded-xl border border-line", fill ? "h-full" : "aspect-[1000/600] sm:aspect-[1000/520]", className),
      )}
    >
      {!data && !error && <MapSkeleton />}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px] text-fg-muted">
          The map could not be loaded. Refresh to try again.
        </div>
      )}
      {data && (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="anim-fade absolute inset-0 h-full w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => setHover(null)}
        >
          <g
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
              transformOrigin: "0 0",
              transition: animate ? "transform 520ms cubic-bezier(0.22, 0.8, 0.24, 1)" : undefined,
            }}
          >
            <CountryPaths countries={data} selected={selected} researched={researched} onEnter={onEnter} onLeave={onLeave} onClick={onClick} />
            {tiny.map((c) => (
              <circle
                key={`hit-${c.code}-${c.cx}`}
                cx={c.cx}
                cy={c.cy}
                r={5 / view.k}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onEnter(c)}
                onMouseLeave={onLeave}
                onClick={() => onClick(c)}
              />
            ))}
            {dots.map((c) => (
              <circle
                key={`dot-${c.code}-${c.cx}`}
                cx={c.cx}
                cy={c.cy}
                r={2.6 / view.k}
                className="pointer-events-none"
                fill={c.code === selected ? "#fff" : "var(--accent)"}
                stroke={c.code === selected ? "var(--accent)" : "var(--bg)"}
                strokeWidth={1.2 / view.k}
              />
            ))}
          </g>
        </svg>
      )}

      {/* Tooltip */}
      {hover?.c.code && hover.x > 0 && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-line bg-bg px-2.5 py-1.5 shadow-pop"
          style={{
            left: Math.min(hover.x + 14, (hover.w ?? 9999) - 200),
            top: hover.y + 14,
            maxWidth: 240,
          }}
        >
          <div className="text-[13px] font-medium">{hover.c.name}</div>
          {describe && <div className="text-[12px] text-fg-muted">{describe(hover.c.code)}</div>}
        </div>
      )}

      {/* Search */}
      {showSearch && data && (
        <div className="absolute left-3 top-3 z-20 w-[min(280px,calc(100%-24px))]">
          <CountrySearch
            countries={searchable}
            researched={researched}
            onPick={(code) => {
              zoomToCountry(code);
              onSelect(code);
            }}
          />
        </div>
      )}

      {/* Controls */}
      {data && (
        <div className="absolute bottom-3 right-3 z-20 flex flex-col overflow-hidden rounded-md border border-line bg-bg shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <MapButton label="Zoom in" touchHidden onClick={() => zoomAt(1.6, W / 2, H / 2, true)}>
            <Plus />
          </MapButton>
          <MapButton label="Zoom out" touchHidden onClick={() => zoomAt(1 / 1.6, W / 2, H / 2, true)}>
            <Minus />
          </MapButton>
          <MapButton
            label="Reset view"
            onClick={() => {
              setAnimate(true);
              setView(IDENTITY);
            }}
          >
            <RotateCcw />
          </MapButton>
          <MapButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? <Minimize2 /> : <Maximize2 />}
          </MapButton>
        </div>
      )}

      {/* Legend */}
      {data && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden items-center gap-4 rounded-md bg-bg/80 px-2.5 py-1.5 text-[11.5px] text-fg-muted backdrop-blur sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border-2 border-bg bg-accent ring-1 ring-accent/30" /> Saved research
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px] bg-accent" /> Selected
          </span>
        </div>
      )}

      {/* Scroll hint */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-1/2 z-10 mx-auto w-fit -translate-y-1/2 rounded-md bg-fg/85 px-3 py-1.5 text-[12.5px] text-bg transition-opacity duration-300",
          hint ? "opacity-100" : "opacity-0",
        )}
      >
        Hold Ctrl or ⌘ and scroll to zoom
      </div>
    </div>
  );
  // Full screen renders on <body>: animated page wrappers would otherwise trap position: fixed
  return fullscreen && typeof document !== "undefined" ? createPortal(node, document.body) : node;
}

/** On touch screens zoom ± is hidden (pinch zoom instead) and remaining buttons get 44px targets. */
function MapButton({ label, onClick, children, touchHidden }: { label: string; onClick: () => void; children: React.ReactNode; touchHidden?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex size-8 items-center justify-center border-b border-line text-fg-muted transition-colors last:border-0 hover:bg-subtle hover:text-fg [&_svg]:size-4 [@media(pointer:coarse)]:size-11 [@media(pointer:coarse)]:[&_svg]:size-5 ${touchHidden ? "[@media(pointer:coarse)]:hidden" : ""}`}
    >
      {children}
    </button>
  );
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="skeleton h-[55%] w-[80%] opacity-70" />
      <span className="text-[12px] text-fg-faint">Loading map…</span>
    </div>
  );
}
