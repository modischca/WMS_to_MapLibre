import { expect, test } from "bun:test";
import { buildMapLibreSource } from "../src/wms/buildMapLibreSource";

test("builds a MapLibre raster source and layer", () => {
  const config = buildMapLibreSource({ baseUrl: "https://example.test/wms", version: "1.1.1", layers: ["land"], styles: [""], format: "image/png", transparent: true, tileSize: 512, crs: "EPSG:3857" });
  expect(config.sources["wms-source"].type).toBe("raster");
  expect(config.sources["wms-source"].tileSize).toBe(512);
  expect(config.layers).toEqual([{ id: "wms-layer", type: "raster", source: "wms-source" }]);
});
