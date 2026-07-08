import { useEffect, useRef, type RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";

// Alert pulse (see DESIGN.md > Motion): sin-driven line-width 2->9px and
// line-opacity 0.85->0.20 at ~450ms period.
const PULSE_LAYER_ID = "alerts-pulse";
const PULSE_PERIOD_MS = 450;
const PULSE_WIDTH_MIN = 2;
const PULSE_WIDTH_SPAN = 7;
const PULSE_OPACITY_MAX = 0.85;
const PULSE_OPACITY_SPAN = 0.65;

/**
 * Animate the alert pulse layer while the map is loaded and reduced-motion is
 * off. Restarts when `reduced` or `styleLoaded` change and stops on unmount.
 * `styleLoaded` gates the start so the effect only runs once the map instance
 * is ready.
 */
export function usePulseLayer(
  mapRef: RefObject<MapRef | null>,
  reduced: boolean,
  styleLoaded: boolean,
): void {
  const rafRef = useRef(0);
  useEffect(() => {
    if (reduced || !styleLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const startTime = performance.now();
    const pulse = (now: number) => {
      // Layer can be momentarily missing during HMR or before the first paint;
      // re-arm until it's back rather than throwing.
      if (!map.getLayer(PULSE_LAYER_ID)) {
        rafRef.current = requestAnimationFrame(pulse);
        return;
      }
      const pulseProgress = (Math.sin((now - startTime) / PULSE_PERIOD_MS) + 1) / 2;
      map.setPaintProperty(
        PULSE_LAYER_ID,
        "line-width",
        PULSE_WIDTH_MIN + pulseProgress * PULSE_WIDTH_SPAN,
      );
      map.setPaintProperty(
        PULSE_LAYER_ID,
        "line-opacity",
        PULSE_OPACITY_MAX - pulseProgress * PULSE_OPACITY_SPAN,
      );
      rafRef.current = requestAnimationFrame(pulse);
    };
    rafRef.current = requestAnimationFrame(pulse);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [mapRef, reduced, styleLoaded]);
}
