import { expect, test } from "bun:test";
import { inspectWms } from "../src/wms/inspect";

test.skipIf(Bun.env.WMS_INTEGRATION !== "1")("inspects public WMS services", async () => {
  const services = [
    "https://demo.mapserver.org/cgi-bin/wms?service=WMS&request=GetCapabilities&version=1.1.1",
    "https://ows.terrestris.de/osm/service?service=WMS&request=GetCapabilities",
  ];
  for (const service of services) {
    const capabilities = await inspectWms(service);
    expect(capabilities.getMapUrl).toStartWith("http");
    expect(capabilities.layers.length).toBeGreaterThan(0);
  }
});
