import type { MapLibreWmsOptions } from "./types";

export function buildMapLibreWmsUrl(options: MapLibreWmsOptions): string {
  if (!options.layers.length) throw new Error("Select at least one WMS layer.");
  if (!/^1\.([01])\./.test(options.version) && options.version !== "1.3.0") {
    throw new Error(`Unsupported WMS version: ${options.version}`);
  }
  if (options.crs.toUpperCase() !== "EPSG:3857") {
    throw new Error("MapLibre raster tiles require EPSG:3857 for {bbox-epsg-3857}.");
  }

  let url: URL;
  try {
    url = new URL(options.baseUrl);
  } catch {
    throw new Error("The WMS GetMap endpoint is not a valid URL.");
  }

  const params = url.searchParams;
  params.set("SERVICE", "WMS");
  params.set("REQUEST", "GetMap");
  params.set("VERSION", options.version);
  params.set("LAYERS", options.layers.join(","));
  params.set("STYLES", options.styles.join(","));
  params.set("FORMAT", options.format);
  params.set("TRANSPARENT", String(options.transparent));
  params.delete("SRS");
  params.delete("CRS");
  params.set(options.version === "1.3.0" ? "CRS" : "SRS", options.crs);
  params.set("BBOX", "{bbox-epsg-3857}");
  params.set("WIDTH", String(options.tileSize));
  params.set("HEIGHT", String(options.tileSize));

  return url.toString().replace(/%7Bbbox-epsg-3857%7D/gi, "{bbox-epsg-3857}");
}
