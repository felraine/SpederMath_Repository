// NumberPlatformTutorial.jsx
import React, { useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Spotlight tutorial overlay that "points" to elements using a cut-out hole.
 * steps: [{ selector, title, body, placement: 'right'|'left'|'top'|'bottom' }]
 * Tokens allowed in title/body: {mode} {targetN} {afterBase} {afterBasePlus} {minN} {maxN}
 */
export default function NumberPlatformTutorial({
  open,
  steps = [],
  step = 0,
  onPrev,
  onNext,
  onClose,
  modeLabel = "Counting",
  targetN = 0,
  afterBase = 0,
  minN = 0,
  maxN = 10,
}) {
  const [rect, setRect] = useState(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0, sx: 0, sy: 0 });
  const pad = 10; // padding around the spotlight target
  const r = 12;   // corner radius for spotlight hole

  const active = steps[step] || {};

  useLayoutEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      if (!open) {
        setRect(null);
        setViewport({
          w: doc.clientWidth,
          h: doc.clientHeight,
          sx: window.scrollX,
          sy: window.scrollY,
        });
        return;
      }
      const el = active.selector ? document.querySelector(active.selector) : null;
      const b = el?.getBoundingClientRect();
      setRect(
        b
          ? {
              x: Math.round(b.left + window.scrollX) - pad,
              y: Math.round(b.top + window.scrollY) - pad,
              w: Math.round(b.width) + pad * 2,
              h: Math.round(b.height) + pad * 2,
            }
          : null
      );
      setViewport({
        w: doc.clientWidth,
        h: doc.clientHeight,
        sx: window.scrollX,
        sy: window.scrollY,
      });
    };

    update();
    const obs = new ResizeObserver(update);
    const el = active.selector ? document.querySelector(active.selector) : null;
    if (el) obs.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [open, step, active.selector]);

  const callout = useMemo(() => {
    if (!open) return null;

    const place = active.placement || "right";
    // Larger gap for top/bottom so the card doesn’t cover the target.
    const gap = place === "top" || place === "bottom" ? 18 : 12;
    const maxW = 360;

    const pos = {
      top: viewport.sy + 100,
      left: viewport.sx + 24,
      arrow: { side: "left" },
    };

    if (rect) {
      if (place === "left") {
        pos.left = rect.x - maxW - gap;
        pos.top = rect.y + rect.h / 2;
        pos.arrow.side = "right";
      } else if (place === "top") {
        pos.left = rect.x + rect.w / 2 - maxW / 2;
        pos.top = rect.y - gap;
        pos.arrow.side = "bottom";
      } else if (place === "bottom") {
        pos.left = rect.x + rect.w / 2 - maxW / 2;
        pos.top = rect.y + rect.h + gap;
        pos.arrow.side = "top";
      } else {
        // right
        pos.left = rect.x + rect.w + gap;
        pos.top = rect.y + rect.h / 2;
        pos.arrow.side = "left";
      }
    }

    // keep within viewport horizontally
    pos.left = Math.max(
      12 + viewport.sx,
      Math.min(pos.left, viewport.sx + viewport.w - maxW - 12)
    );

    return { ...pos, maxW, place };
  }, [rect, active.placement, viewport, open]);

  const maskPath = useMemo(() => {
    if (!rect) return `M 0 0 H ${viewport.w} V ${viewport.h} H 0 Z`; // no hole if not found
    const x = rect.x - viewport.sx;
    const y = rect.y - viewport.sy;
    const w = rect.w;
    const h = rect.h;
    return `
      M 0 0 H ${viewport.w} V ${viewport.h} H 0 Z
      M ${x} ${y + r}
        Q ${x} ${y} ${x + r} ${y}
        H ${x + w - r}
        Q ${x + w} ${y} ${x + w} ${y + r}
        V ${y + h - r}
        Q ${x + w} ${y + h} ${x + w - r} ${y + h}
        H ${x + r}
        Q ${x} ${y + h} ${x} ${y + h - r}
        Z
    `;
  }, [rect, viewport, r]);

  const tokenize = (s = "") =>
    s
      .replaceAll("{mode}", modeLabel)
      .replaceAll("{targetN}", String(targetN))
      .replaceAll("{afterBase}", String(afterBase))
      .replaceAll("{afterBasePlus}", String(afterBase + 1))
      .replaceAll("{minN}", String(minN))
      .replaceAll("{maxN}", String(maxN));

  const resolvedTitle = tokenize(active.title || "");
  const resolvedBody = tokenize(active.body || "");

  if (!open) return null;

  const content = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "auto" }}
      aria-modal="true"
      role="dialog"
      >
      <div
        style={{ position: "absolute", inset: 0, background: "transparent", cursor: "not-allowed" }}
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      />
      {/* Dim + cutout */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden role="presentation">
        <path d={maskPath || ""} fill="rgba(0,0,0,0.55)" fillRule="evenodd" />
      </svg>

      {/* Pulsing ring over target (only if found) */}
      {rect && (
        <div
          style={{
            position: "absolute",
            top: rect.y - viewport.sy,
            left: rect.x - viewport.sx,
            width: rect.w,
            height: rect.h,
            borderRadius: r,
            boxShadow: "0 0 0 3px rgba(255,255,255,0.9)",
            animation: "npPulse 1.6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Callout card */}
      {callout && (
        <div
          style={{
            position: "absolute",
            top: callout.top - viewport.sy,
            left: callout.left - viewport.sx,
            width: callout.maxW,
            maxWidth: callout.maxW,
            // Placement-aware transform:
            transform:
              rect && (callout.place === "left" || callout.place === "right")
                ? "translateY(-50%)"
                : rect && callout.place === "top"
                ? "translateY(-100%)"
                : "none",
            background: "white",
            borderRadius: 12,
            padding: "12px 14px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
            pointerEvents: "auto",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>{resolvedTitle}</div>
          <div style={{ fontSize: 14, lineHeight: 1.35, marginBottom: 10 }}>
            {resolvedBody}
            {!rect && active.selector ? (
              <div className="text-xs text-red-600 mt-2">
                (Heads-up: target <code>{active.selector}</code> not found yet. You can still proceed.)
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 font-semibold"
            >
              Skip
            </button>
            <div className="flex gap-2">
              <button
                onClick={onPrev}
                disabled={step === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 font-semibold disabled:opacity-50"
              >
                Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={onNext}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Start
                </button>
              )}
            </div>
          </div>

          {/* Small arrow triangle */}
          {rect && (
            <svg
              width="28"
              height="28"
              style={{
                position: "absolute",
                ...(callout.arrow?.side === "left"
                  ? { left: -14, top: "50%", transform: "translateY(-50%)" }
                  : callout.arrow?.side === "right"
                  ? { right: -14, top: "50%", transform: "translateY(-50%)" }
                  : callout.arrow?.side === "top"
                  ? { top: -14, left: "50%", transform: "translateX(-50%)" }
                  : { bottom: -14, left: "50%", transform: "translateX(-50%)" }),
              }}
            >
              <polygon points="0,14 28,0 28,28" fill="white" stroke="rgba(0,0,0,0.15)" />
            </svg>
          )}
        </div>
      )}

      <style>{`
        @keyframes npPulse {
          0%   { box-shadow: 0 0 0 3px rgba(255,255,255,0.9), 0 0 0 3px rgba(31,122,238,0.0); }
          70%  { box-shadow: 0 0 0 3px rgba(255,255,255,0.9), 0 0 0 12px rgba(31,122,238,0.35); }
          100% { box-shadow: 0 0 0 3px rgba(255,255,255,0.9), 0 0 0 16px rgba(31,122,238,0.0); }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}

/** Prebuilt steps you can pass to the tutorial */
export const numberPlatformTourSteps = [
  {
    selector: ".np-prompt",
    title: "Welcome to Number Platform",
    body: "In {mode}, we start at {minN} and climb to {maxN}. Follow the instruction here.",
    placement: "bottom",
  },
  {
    selector: ".np-platform-bottom",
    title: "Your Current Number",
    body: "You are standing on this platform. It shows your current number: {targetN}.",
    placement: "top",
  },
  {
    selector: ".np-platform-left",
    title: "Pick the Next Number",
    body: "Choose the platform that comes after your current number.",
    placement: "right",
  },
  {
    selector: ".np-platform-right",
    title: "Or Pick This One",
    body: "Only one is correct. If you’re wrong, you’ll lose a life.",
    placement: "left",
  },
  {
    selector: ".np-hud",
    title: "Watch Lives & Rounds",
    body: "Keep an eye on your ❤️ Lives and your progress here.",
    placement: "bottom",
  },
  {
    selector: ".np-avatar-circle",
    title: "Your Avatar",
    body: "You’ll hop to the chosen platform. Reach {maxN} to score a point!",
    placement: "right",
  },
];
