import { buildMapLibreCode, buildMapLibreSource } from "./wms/buildMapLibreSource";
import { buildMapLibreWmsUrl } from "./wms/buildGetMapUrl";
import type { ParsedWms, WmsLayer } from "./wms/types";

const form = document.querySelector<HTMLFormElement>("#inspect-form")!;
const message = document.querySelector<HTMLElement>("#message")!;
const workspace = document.querySelector<HTMLElement>("#workspace")!;
const status = document.querySelector<HTMLElement>("#status")!;
const version = document.querySelector<HTMLSelectElement>("#version")!;
const layers = document.querySelector<HTMLSelectElement>("#layers")!;
const crs = document.querySelector<HTMLSelectElement>("#crs")!;
const format = document.querySelector<HTMLSelectElement>("#format")!;
const tileSize = document.querySelector<HTMLSelectElement>("#tile-size")!;
const transparent = document.querySelector<HTMLInputElement>("#transparent")!;
const styles = document.querySelector<HTMLElement>("#style-controls")!;
const description = document.querySelector<HTMLElement>("#layer-description")!;
const generatedUrl = document.querySelector<HTMLTextAreaElement>("#generated-url")!;
const generatedConfig = document.querySelector<HTMLTextAreaElement>("#generated-config")!;

let capabilities: ParsedWms | undefined;

const option = (value: string, label = value) => new Option(label, value);
const selectedLayers = () => Array.from(layers.selectedOptions).map(({ value }) => capabilities!.layers.find((layer) => layer.name === value)!).filter(Boolean);
const has3857 = (layer: WmsLayer) => layer.crs.some((value) => value.toUpperCase() === "EPSG:3857");

function commonCrs(selected: WmsLayer[]) {
  return selected.length ? selected[0].crs.filter((candidate) => selected.every((layer) => layer.crs.some((value) => value.toUpperCase() === candidate.toUpperCase()))) : [];
}

function preferredFormat(formats: string[]) {
  return ["image/png", "image/png8", "image/jpeg"].find((candidate) => formats.includes(candidate)) ?? formats[0];
}

function renderStyles(selected: WmsLayer[], selectedValues: Map<string, string>) {
  styles.replaceChildren();
  if (!selected.length) return;
  const label = document.createElement("label");
  label.textContent = "Styles";
  styles.append(label);
  for (const layer of selected) {
    const select = document.createElement("select");
    select.dataset.layer = layer.name;
    select.setAttribute("aria-label", `Style for ${layer.title ?? layer.name}`);
    select.append(option("", `${layer.title ?? layer.name}: default`));
    for (const style of layer.styles) select.append(option(style.name, `${layer.title ?? layer.name}: ${style.title ?? style.name}`));
    select.value = selectedValues.get(layer.name) ?? "";
    select.addEventListener("change", generate);
    styles.append(select);
  }
}

function generate() {
  if (!capabilities) return;
  const selected = selectedLayers();
  const selectedStyles = new Map(Array.from(styles.querySelectorAll<HTMLSelectElement>("select")).map((select) => [select.dataset.layer!, select.value]));
  const supportedCrs = commonCrs(selected);
  const compatible = selected.length > 0 && selected.every(has3857);
  crs.replaceChildren(...supportedCrs.map((value) => option(value)));
  if (supportedCrs.some((value) => value.toUpperCase() === "EPSG:3857")) crs.value = supportedCrs.find((value) => value.toUpperCase() === "EPSG:3857")!;
  renderStyles(selected, selectedStyles);
  description.textContent = selected.map((layer) => layer.abstract).filter(Boolean).join(" ");
  status.classList.toggle("warning", !compatible);
  status.textContent = compatible
    ? `OK WMS ${capabilities.version} detected\nOK GetMap endpoint available\nOK EPSG:3857 supported by all selected layers\nOK Compatible with MapLibre raster tiles`
    : `OK WMS ${capabilities.version} detected\nOK GetMap endpoint available\nWarning: selected layers do not share EPSG:3857. MapLibre cannot use {bbox-epsg-3857} directly.`;
  if (!compatible) { generatedUrl.value = ""; generatedConfig.value = ""; return; }
  try {
    const styleValues = Array.from(styles.querySelectorAll<HTMLSelectElement>("select")).map((select) => select.value);
    const settings = { baseUrl: capabilities.getMapUrl, version: version.value, layers: selected.map((layer) => layer.name), styles: styleValues, format: format.value, transparent: transparent.checked, tileSize: Number(tileSize.value) as 256 | 512, crs: crs.value };
    generatedUrl.value = buildMapLibreWmsUrl(settings);
    generatedConfig.value = `${buildMapLibreCode(buildMapLibreSource(settings))}\n\n// MapLibre style fragment\n${JSON.stringify(buildMapLibreSource(settings), null, 2)}`;
  } catch (error) { message.textContent = error instanceof Error ? error.message : "Unable to generate the MapLibre configuration."; }
}

async function inspect(event: SubmitEvent) {
  event.preventDefault();
  message.textContent = "Inspecting WMS capabilities...";
  workspace.hidden = true;
  try {
    const input = new FormData(form).get("url");
    const response = await fetch(`/api/wms/capabilities?url=${encodeURIComponent(String(input))}`);
    const data = await response.json() as ParsedWms | { error: string };
    if (!response.ok || "error" in data) throw new Error("error" in data ? data.error : "Could not inspect the WMS service.");
    capabilities = data;
    version.replaceChildren(option(data.version));
    layers.replaceChildren(...data.layers.map((layer) => option(layer.name, layer.title ? `${layer.title} (${layer.name})` : layer.name)));
    if (layers.options.length) layers.options[0].selected = true;
    format.replaceChildren(...data.formats.map((value) => option(value)));
    format.value = preferredFormat(data.formats);
    workspace.hidden = false;
    message.textContent = "";
    generate();
  } catch (error) { message.textContent = error instanceof Error ? error.message : "Unable to inspect the WMS service."; }
}

form.addEventListener("submit", inspect);
for (const control of [layers, format, tileSize, transparent]) control.addEventListener("change", generate);
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
  const target = document.querySelector<HTMLTextAreaElement>(`#${button.dataset.copy}`)!;
  await navigator.clipboard.writeText(target.value);
  const original = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => { button.textContent = original; }, 1200);
}));
