export type WmsStyle = {
  name: string;
  title?: string;
};

export type WmsLayer = {
  name: string;
  title?: string;
  abstract?: string;
  crs: string[];
  styles: WmsStyle[];
};

export type ParsedWms = {
  version: string;
  getMapUrl: string;
  formats: string[];
  layers: WmsLayer[];
};

export type MapLibreWmsOptions = {
  baseUrl: string;
  version: string;
  layers: string[];
  styles: string[];
  format: string;
  transparent: boolean;
  tileSize: 256 | 512;
  crs: string;
};

export type MapLibreSourceConfig = {
  sources: Record<string, { type: "raster"; tiles: string[]; tileSize: 256 | 512 }>;
  layers: Array<{ id: string; type: "raster"; source: string }>;
};
