// src/reusable/ThemeLoader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ThemeLoader
 * Props:
 * - source: string | File | { src: string, type?: 'video'|'image' }
 * - posterSrc?: string   // optional poster for videos (or fallback still)
 * - overlayClassName?: string // optional overlay styling
 * - className?: string   // wrapper classes
 * - children: React.ReactNode // foreground content
 * - autoDetect?: boolean // default true: detect by file extension/MIME
 * - reduceMotionFallback?: 'image' | 'none' // what to do if prefers-reduced-motion for videos
 * - onReady?: (meta: { type: 'video'|'image', src: string }) => void
 */
const ThemeLoader = ({
  source,
  posterSrc,
  overlayClassName = "",
  className = "",
  children,
  autoDetect = true,
  reduceMotionFallback = "image",
  onReady,
}) => {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [resolvedType, setResolvedType] = useState(null); // 'video' | 'image'
  const objectUrlRef = useRef(null);

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Infer type from input
  const inferType = (src, fileObj) => {
    if (!autoDetect) return null;
    if (fileObj && fileObj.type) {
      if (fileObj.type.startsWith("video/")) return "video";
      if (fileObj.type.startsWith("image/")) return "image";
    }
    if (typeof src === "string") {
      const lower = src.toLowerCase();
      if (/\.(mp4|webm|mov|ogg|ogv|m4v)$/.test(lower)) return "video";
      if (/\.(png|jpg|jpeg|gif|svg|webp|avif)$/.test(lower)) return "image";
    }
    return null; // unknown
  };

  useEffect(() => {
    // cleanup old object url if any
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let src = null;
    let type = null;

    // 1) { src, type }
    if (source && typeof source === "object" && "src" in source) {
      src = source.src;
      type = source.type || inferType(source.src, null);
    }
    // 2) File/Blob
    else if (source instanceof Blob) {
      src = URL.createObjectURL(source);
      objectUrlRef.current = src;
      type = inferType(null, source);
    }
    // 3) plain string (URL)
    else if (typeof source === "string") {
      src = source;
      type = inferType(source, null);
    }

    // Safety fallback
    if (!type) {
      // default to image if unknown
      type = "image";
    }

    // Respect reduced motion
    if (prefersReducedMotion && type === "video") {
      if (reduceMotionFallback === "image") {
        // if poster exists, show poster as image, else keep video paused (but we’ll render as image)
        type = "image";
        src = posterSrc || src; // try poster first
      } else if (reduceMotionFallback === "none") {
        // render nothing behind
        setResolvedSrc(null);
        setResolvedType(null);
        onReady?.({ type: "none", src: "" });
        return;
      }
    }

    setResolvedSrc(src);
    setResolvedType(type);
    onReady?.({ type, src });

    // cleanup old object url if we re-resolve
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, posterSrc, autoDetect, reduceMotionFallback, prefersReducedMotion]);

  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Background Layer */}
      {resolvedType === "video" && resolvedSrc && (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={posterSrc}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={resolvedSrc} type="video/mp4" />
        </video>
      )}

      {resolvedType === "image" && resolvedSrc && (
        <img
          src={resolvedSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Optional subtle overlay to improve contrast */}
      <div
        className={`absolute inset-0 pointer-events-none ${overlayClassName}`}
        aria-hidden
      />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};

export default ThemeLoader;
