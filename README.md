# WMS to MapLibre

A small Bun web app that inspects a WMS GetCapabilities endpoint and generates a MapLibre raster source and layer.

## Requirements

[Bun](https://bun.sh/) 1.0 or later.

## Run

```sh
bun install
bun run dev
```

Open [http://localhost:3002](http://localhost:3002), enter a WMS URL, select compatible layers, then copy the generated MapLibre configuration.

The URL may be a WMS base URL or an existing GetCapabilities URL. The app adds the required `SERVICE=WMS` and `REQUEST=GetCapabilities` parameters.

## Commands

```sh
bun run dev    # type-check, build the browser bundle, and watch the server
bun run build  # type-check and build public/assets/main.js
bun run start  # serve the built app
bun test       # run unit tests
```

To run the public-service integration test:

```sh
WMS_INTEGRATION=1 bun test
```

## Notes

- Generated MapLibre raster tiles require every selected WMS layer to support `EPSG:3857`.
- The server only fetches HTTP(S) endpoints and rejects localhost addresses.
- WMS 1.1.x and 1.3.0 GetMap URLs are supported.
