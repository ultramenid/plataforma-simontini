import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  ALERT_COLOR,
  BASEMAP,
  BASEMAP_FOR_THEME,
  boundsOfRing,
  getAlert,
} from "@/lib/data";
import type { AlertFeature, BasemapKey } from "@/lib/types";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { usePulseLayer } from "@/lib/use-pulse-layer";

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

// Map motion timings (see DESIGN.md > Motion).
const FIT_BOUNDS_MS = 1400;
const RESET_FLY_MS = 1200;

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
  const onSelectRef = useRef(onSelect);
  const firstFitRef = useRef(true);

  const [webglError, setWebglError] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  usePulseLayer(mapRef, reduced, styleLoaded);

  const fitAlert = useCallback(
    (id: string, instant: boolean) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const alert = getAlert(id);
      if (!alert) return;
      const ring = alert.geometry.coordinates[0];
      if (!ring || ring.length === 0) return;
      map.fitBounds(boundsOfRing(ring), {
        padding: embed ? 60 : 120,
        duration: instant ? 0 : FIT_BOUNDS_MS,
        maxZoom: 12,
      });
    },
    [embed],
  );

  // Mirror activeId into a ref so onMapLoad sees the latest value.
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  function onMapLoad() {
    setStyleLoaded(true);
    // First load is the only instant fit (deep-link); style reloads (theme/basemap
    // change re-fire onLoad) animate, and so do all later activeId changes.
    if (activeIdRef.current) fitAlert(activeIdRef.current, firstFitRef.current);
    firstFitRef.current = false;
  }

  // Fit to the selected alert whenever it changes. onMapLoad already handled the
  // instant deep-link fit and cleared firstFitRef, so this path always animates.
  useEffect(() => {
    if (!activeId || !styleLoaded) return;
    fitAlert(activeId, false);
  }, [activeId, styleLoaded, fitAlert]);

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
      duration: reduced ? 0 : RESET_FLY_MS,
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

  function onAlertClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    const id = feature?.properties?.id;
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
        onError={(event) => {
          setMapError(event.error.message);
          if (/webgl/i.test(event.error.message)) setWebglError(true);
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
