import { useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, type StyleSpecification } from "maplibre-gl";

import { SEVERITY_COLOR, toLngLat } from "@/lib/data";
import type { Polygon, Severity } from "@/lib/types";

interface MiniMapProps {
  geometry: Polygon;
  severity: Severity;
  center: [number, number];
}

const SAT_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    sat: {
      type: "raster",
      tileSize: 256,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      attribution: "Imagery © Esri",
    },
  },
  layers: [{ id: "sat", type: "raster", source: "sat" }],
};

export function MiniMap({ geometry, severity, center }: MiniMapProps) {
  const ref = useRef<MapRef>(null);
  const [err, setErr] = useState(false);

  function fitToPolygon() {
    const map = ref.current?.getMap();
    if (!map) return;
    const ring = geometry.coordinates[0];
    if (!ring || ring.length === 0) return;
    const first = toLngLat(ring[0]);
    const bounds = ring.reduce(
      (b, c) => b.extend(toLngLat(c)),
      new LngLatBounds(first, first),
    );
    map.fitBounds(bounds, { padding: 50, duration: 0 });
  }

  useEffect(() => {
    fitToPolygon();
    // fitToPolygon is a mount-only fit; deps are intentionally empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps
  }, []);

  return (
    <div className="minimap-wrap relative min-h-[280px] overflow-hidden rounded-md border border-line">
      <Map
        ref={ref}
        mapStyle={SAT_STYLE}
        initialViewState={{ longitude: center[0], latitude: center[1], zoom: 10 }}
        interactiveLayerIds={[]}
        onLoad={fitToPolygon}
        onError={() => setErr(true)}
        attributionControl={false}
        style={{ position: "absolute", inset: 0 }}
      >
        <Source
          id="alert"
          type="geojson"
          data={{ type: "Feature" as const, properties: {}, geometry }}
        >
          <Layer
            id="f"
            type="fill"
            paint={{
              "fill-color": SEVERITY_COLOR[severity],
              "fill-opacity": 0.3,
            }}
          />
          <Layer
            id="l"
            type="line"
            paint={{
              "line-color": SEVERITY_COLOR[severity],
              "line-width": 2.5,
            }}
          />
        </Source>
      </Map>
      {err && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-muted-foreground">
          Location map needs WebGL. Coordinates: {center[1].toFixed(3)},{" "}
          {center[0].toFixed(3)}
        </div>
      )}
    </div>
  );
}
