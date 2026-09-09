import { describe, expect, test } from "bun:test";
import { parseCapabilities } from "../src/wms/parseCapabilities";

const fixture = (name: string) => Bun.file(`${import.meta.dir}/fixtures/${name}`).text();

describe("parseCapabilities", () => {
  test("normalizes a WMS 1.1.1 document and inherited SRS/styles", async () => {
    const parsed = parseCapabilities(await fixture("wms-1.1.1.xml"));
    expect(parsed.version).toBe("1.1.1");
    expect(parsed.getMapUrl).toBe("https://maps.example.test/wms?token=keep");
    expect(parsed.formats).toEqual(["image/png", "image/jpeg"]);
    expect(parsed.layers.map((layer) => layer.name)).toEqual(["land", "roads"]);
    expect(parsed.layers[0].crs).toEqual(["EPSG:3857", "EPSG:4326"]);
    expect(parsed.layers[1].styles.map((style) => style.name)).toEqual(["base", "line"]);
  });

  test("flattens nested 1.3.0 layers and excludes unnamed groups", async () => {
    const parsed = parseCapabilities(await fixture("wms-1.3.0-nested.xml"));
    expect(parsed.version).toBe("1.3.0");
    expect(parsed.layers.map((layer) => layer.name)).toEqual(["contours", "local-grid"]);
    expect(parsed.layers[0].crs).toContain("EPSG:3857");
    expect(parsed.layers[1].crs).toContain("EPSG:25832");
  });

  test("reports malformed and non-WMS documents", () => {
    expect(() => parseCapabilities("<not-closed>")).toThrow("Invalid XML");
    expect(() => parseCapabilities("<document />")).toThrow("not a WMS");
  });
});
