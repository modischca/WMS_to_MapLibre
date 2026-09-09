import { buildMapLibreWmsUrl } from "./buildGetMapUrl";
import type { MapLibreSourceConfig, MapLibreWmsOptions } from "./types";

export function buildMapLibreSource(options: MapLibreWmsOptions): MapLibreSourceConfig {
  const tileUrl = buildMapLibreWmsUrl(options);
  return {
    sources: {
      "wms-source": { type: "raster", tiles: [tileUrl], tileSize: options.tileSize },
    },
    layers: [{ id: "wms-layer", type: "raster", source: "wms-source" }],
  };
}

export function buildMapLibreCode(config: MapLibreSourceConfig): string {
  const source = JSON.stringify(config.sources["wms-source"], null, 2);
  const layer = JSON.stringify(config.layers[0], null, 2);
  return `map.addSource("wms-source", ${source});\n\nmap.addLayer(${layer});`;
}
