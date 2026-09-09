import { describe, expect, test } from "bun:test";
import { buildMapLibreWmsUrl } from "../src/wms/buildGetMapUrl";

describe("buildMapLibreWmsUrl", () => {
  test("uses SRS for WMS 1.1.1, preserves endpoint params, and leaves bbox unencoded", () => {
    const url = buildMapLibreWmsUrl({ baseUrl: "https://example.test/wms?token=abc&CRS=EPSG:4326", version: "1.1.1", layers: ["land", "roads"], styles: ["", "line"], format: "image/png", transparent: true, tileSize: 256, crs: "EPSG:3857" });
    expect(url).toContain("token=abc");
    expect(url).toContain("SRS=EPSG%3A3857");
    expect(url).not.toContain("CRS=");
    expect(url).toContain("LAYERS=land%2Croads");
    expect(url).toContain("STYLES=%2Cline");
    expect(url).toContain("BBOX={bbox-epsg-3857}");
    expect(url).not.toContain("%7Bbbox-epsg-3857%7D");
    expect(url).toContain("WIDTH=256");
    expect(url).toContain("HEIGHT=256");
  });

  test("uses CRS for WMS 1.3.0 and synchronizes 512 pixel tiles", () => {
    const url = buildMapLibreWmsUrl({ baseUrl: "https://example.test/wms?SRS=EPSG:4326", version: "1.3.0", layers: ["land"], styles: [""], format: "image/png", transparent: false, tileSize: 512, crs: "EPSG:3857" });
    expect(url).toContain("CRS=EPSG%3A3857");
    expect(url).not.toContain("SRS=");
    expect(url).toContain("WIDTH=512");
    expect(url).toContain("HEIGHT=512");
  });

  test("rejects a CRS incompatible with MapLibre bbox tiles", () => {
    expect(() => buildMapLibreWmsUrl({ baseUrl: "https://example.test/wms", version: "1.3.0", layers: ["land"], styles: [""], format: "image/png", transparent: true, tileSize: 256, crs: "EPSG:4326" })).toThrow("require EPSG:3857");
  });
});
