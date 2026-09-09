import { parseCapabilities } from "./parseCapabilities";
import type { ParsedWms } from "./types";

export async function inspectWms(url: string, fetcher: typeof fetch = fetch): Promise<ParsedWms> {
  let endpoint: URL;
  try {
    endpoint = new URL(url);
  } catch {
    throw new Error("Enter a valid WMS GetCapabilities URL.");
  }
  if (!/^https?:$/.test(endpoint.protocol)) throw new Error("Only HTTP and HTTPS WMS URLs are supported.");

  endpoint.searchParams.set("SERVICE", "WMS");
  endpoint.searchParams.set("REQUEST", "GetCapabilities");
  let response: Response;
  try {
    response = await fetcher(endpoint);
  } catch (error) {
    throw new Error(`Could not fetch capabilities: ${error instanceof Error ? error.message : "network failure"}`);
  }
  if (!response.ok) throw new Error(`The WMS server returned HTTP ${response.status} ${response.statusText}.`);
  const xml = await response.text();
  if (!xml.trim()) throw new Error("The WMS server returned an empty capabilities document.");
  return parseCapabilities(xml);
}
