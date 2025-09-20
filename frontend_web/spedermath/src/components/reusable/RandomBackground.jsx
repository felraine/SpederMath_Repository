import { useRef } from "react";

export default function useRandomBackground(images = []) {
  const chosen = useRef(null);

  if (chosen.current === null) {
    if (!Array.isArray(images) || images.length === 0) return null;
    const idx = Math.floor(Math.random() * images.length);
    chosen.current = images[idx];
  }

  return chosen.current;
}
