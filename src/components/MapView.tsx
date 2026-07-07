import { useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds } from "maplibre-gl";

import {
  ALERT_COLOR,
  BASEMAP,
  BASEMAP_FOR_THEME,
  getAlert,
  toLngLat,
} from "@/lib/data";
import type { AlertFeature, BasemapKey } from "@/lib/types";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface MapViewProps {
  features: AlertFeature[];
  activeId: string | null;
  basemap: BasemapKey;
  theme?: "light" | "dark";
  resetToken?: number;
  embed?: boolean;
  onSelect: (id: string) => void;
}

const INITIAL_VIEW = { longitude: 120, latitude: 5, zoom: 3.5 };

export function MapView({
  features,
  activeId,
  basemap,
  theme = "light",
  resetToken = 0,
  embed = false,
  onSelect,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const rafRef = useRef(0);
  const onSelectRef = useRef(onSelect);
  const firstFitRef = useRef(true);

  const [webglError, setWebglError] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  function startPulse() {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (rafRef.current) return; // ponytail: a pulse loop is already running; don't double-start on HMR/StrictMode
    const t0 = performance.now();
    const pulse = (now: number) => {
      // ponytail: layer can be momentarily missing during HMR; bail until it's back, then re-arm
      if (!map.getLayer("alerts-pulse")) {
        rafRef.current = requestAnimationFrame(pulse);
        return;
      }
      const k = (Math.sin((now - t0) / 450) + 1) / 2;
      map.setPaintProperty("alerts-pulse", "line-width", 2 + k * 7);
      map.setPaintProperty("alerts-pulse", "line-opacity", 0.85 - k * 0.65);
      rafRef.current = requestAnimationFrame(pulse);
    };
    rafRef.current = requestAnimationFrame(pulse);
  }

  function stopPulse() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }

  function fitAlert(id: string, instant: boolean) {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const a = getAlert(id);
    if (!a) return;
    const ring = a.geometry.coordinates[0];
    if (!ring || ring.length === 0) return;
    const first = toLngLat(ring[0]);
    const bounds = ring.reduce(
      (b, c) => b.extend(toLngLat(c)),
      new LngLatBounds(first, first),
    );
    map.fitBounds(bounds, {
      padding: 120,
      duration: instant ? 0 : 1400,
      maxZoom: 12,
    });
  }

  // Stop pulse on unmount.
  useEffect(() => stopPulse, []);

  // Mirror props into refs so onMapLoad sees the latest values.
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  function onMapLoad() {
    setStyleLoaded(true);
    const map = mapRef.current?.getMap();
    if (activeIdRef.current) fitAlert(activeIdRef.current, firstFitRef.current);
    firstFitRef.current = false;
    if (reducedRef.current || !map) return;
    // ponytail: <Source>/<Layer> children are added after this fires; wait for the first idle paint so the layer exists before pulse touches it
    map.once("idle", () => {
      if (mapRef.current?.getMap() !== map) return;
      if (reducedRef.current) return;
      startPulse();
    });
  }

  // Restart or stop pulse when reduced-motion changes.
  useEffect(() => {
    if (!styleLoaded) return;
    if (reduced) stopPulse();
    else startPulse();
  }, [reduced, styleLoaded]);

  // Fit to the selected alert whenever it changes (after first fit).
  useEffect(() => {
    if (!activeId || !styleLoaded) return;
    fitAlert(activeId, firstFitRef.current);
    firstFitRef.current = false;
  }, [activeId, styleLoaded]);

  // Reset to the initial extent when resetToken changes (double-Esc).
  const resetTokenRef = useRef(resetToken);
  useEffect(() => {
    if (resetToken === resetTokenRef.current) return;
    resetTokenRef.current = resetToken;
    if (!styleLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.flyTo({
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      duration: reduced ? 0 : 1200,
      essential: true,
    });
  }, [resetToken, styleLoaded, reduced]);

  const satVisible = basemap === "sat";
  const alertsFC = { type: "FeatureCollection" as const, features };

  // Embed mode: a static view locked on the alert — no gestures, no selection.
  const interactionProps = embed
    ? {
        scrollZoom: false,
        dragPan: false,
        dragRotate: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        touchPitch: false,
        keyboard: false,
        boxZoom: false,
      }
    : {
        interactiveLayerIds: ["alerts-fill"],
        onClick: onAlertClick,
        onMouseEnter: onAlertEnter,
        onMouseLeave: onAlertLeave,
      };

  function onAlertClick(e: MapLayerMouseEvent) {
    const f = e.features?.[0];
    const id = f?.properties?.id;
    if (typeof id === "string") onSelectRef.current(id);
  }
  function onAlertEnter() {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = "pointer";
  }
  function onAlertLeave() {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = "";
  }

  return (
    <>
      {!styleLoaded && !webglError && !mapError && (
        <div className="pointer-events-none absolute inset-0 z-[9999999] flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <p className="text-muted-foreground">Loading map…</p>
        </div>
      )}
      {(webglError || mapError) && (
        <div className="pointer-events-none absolute inset-0 z-[9999999] flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <p className="text-muted-foreground">
            {mapError ||
              "The map needs WebGL, which this browser has disabled."}
          </p>
        </div>
      )}
      <Map
        ref={mapRef}
        mapStyle={BASEMAP_FOR_THEME(theme)}
        initialViewState={INITIAL_VIEW}
        minZoom={2}
        onLoad={onMapLoad}
        onError={(e) => {
          setMapError(e.error.message);
          if (/webgl/i.test(e.error.message)) setWebglError(true);
        }}
        {...interactionProps}
        style={{ position: "absolute", inset: 0 }}
      >
        <Source
          id="base-sat"
          type="raster"
          tiles={[...BASEMAP.sat.tiles]}
          tileSize={256}
          attribution={BASEMAP.sat.attribution}
        >
          <Layer
            id="base-sat"
            type="raster"
            layout={{ visibility: satVisible ? "visible" : "none" }}
          />
        </Source>
        <Source id="alerts" type="geojson" data={alertsFC}>
          <Layer
            id="alerts-fill"
            type="fill"
            paint={{ "fill-color": ALERT_COLOR, "fill-opacity": 0.25 }}
          />
          <Layer
            id="alerts-line"
            type="line"
            paint={{ "line-color": ALERT_COLOR, "line-width": 2 }}
          />
          <Layer
            id="alerts-pulse"
            type="line"
            paint={{
              "line-color": ALERT_COLOR,
              "line-width": 2,
              "line-opacity": 0.9,
              "line-blur": 2,
            }}
          />
        </Source>
        <ScaleControl position="bottom-right" />
      </Map>
    </>
  );
}
