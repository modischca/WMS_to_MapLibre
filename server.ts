import { inspectWms } from "./src/wms/inspect";

const root = `${import.meta.dir}/public`;

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function isUnsafeHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "::1" || host === "0.0.0.0" || host.startsWith("127.");
}

Bun.serve({
  port: Number(Bun.env.PORT ?? 3002),
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/wms/capabilities") {
      const target = url.searchParams.get("url");
      if (!target) return error("The 'url' query parameter is required.");
      try {
        const parsed = new URL(target);
        if (!/^https?:$/.test(parsed.protocol)) return error("Only HTTP and HTTPS WMS URLs are supported.");
        if (isUnsafeHost(parsed.hostname)) return error("Local WMS URLs cannot be fetched through this proxy.");
        return Response.json(await inspectWms(target));
      } catch (cause) {
        return error(cause instanceof Error ? cause.message : "Unable to inspect this WMS service.", 502);
      }
    }
    if (url.pathname === "/" || url.pathname === "/index.html") return new Response(Bun.file(`${root}/index.html`));
    if (url.pathname === "/app.css") return new Response(Bun.file(`${root}/app.css`));
    if (url.pathname === "/assets/main.js") return new Response(Bun.file(`${root}/assets/main.js`));
    return new Response("Not found", { status: 404 });
  },
});

console.log(`WMS config generator running on http://localhost:${Bun.env.PORT ?? 3002}`);
