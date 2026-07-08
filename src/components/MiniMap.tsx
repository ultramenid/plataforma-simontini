import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { type StyleSpecification } from "maplibre-gl";

import { BASEMAP, SEVERITY_COLOR, boundsOfRing } from "@/lib/data";
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
      tiles: [...BASEMAP.sat.tiles],
      attribution: BASEMAP.sat.attribution,
    },
  },
  layers: [{ id: "sat", type: "raster", source: "sat" }],
};

export function MiniMap({ geometry, severity, center }: MiniMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [hasError, setHasError] = useState(false);

  const fitToPolygon = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const ring = geometry.coordinates[0];
    if (!ring || ring.length === 0) return;
    map.fitBounds(boundsOfRing(ring), { padding: 50, duration: 0 });
  }, [geometry]);

  useEffect(() => {
    fitToPolygon();
  }, [fitToPolygon]);

  return (
    <div className="minimap-wrap relative min-h-[280px] overflow-hidden rounded-md border border-line">
      <Map
        ref={mapRef}
        mapStyle={SAT_STYLE}
        initialViewState={{ longitude: center[0], latitude: center[1], zoom: 10 }}
        interactiveLayerIds={[]}
        onLoad={fitToPolygon}
        onError={() => setHasError(true)}
        attributionControl={false}
        style={{ position: "absolute", inset: 0 }}
      >
        <Source
          id="alert"
          type="geojson"
          data={{ type: "Feature" as const, properties: {}, geometry }}
        >
          <Layer
            id="alert-fill"
            type="fill"
            paint={{
              "fill-color": SEVERITY_COLOR[severity],
              "fill-opacity": 0.3,
            }}
          />
          <Layer
            id="alert-line"
            type="line"
            paint={{
              "line-color": SEVERITY_COLOR[severity],
              "line-width": 2.5,
            }}
          />
        </Source>
      </Map>
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-muted-foreground">
          Location map needs WebGL. Coordinates: {center[1].toFixed(3)},{" "}
          {center[0].toFixed(3)}
        </div>
      )}
    </div>
  );
}
