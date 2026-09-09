import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { ParsedWms, WmsLayer, WmsStyle } from "./types";

type XmlObject = Record<string, unknown>;

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
});

const array = (value: unknown): unknown[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const object = (value: unknown): XmlObject | undefined => value && typeof value === "object" ? value as XmlObject : undefined;
const text = (value: unknown): string | undefined => typeof value === "string" ? value.trim() || undefined : undefined;
const values = (source: XmlObject, key: string) => array(source[key]).flatMap((value) => text(value) ?? []);
const unique = (items: string[]) => [...new Set(items)];

function getMapEndpoint(getMap: XmlObject): string | undefined {
  for (const dcpType of array(getMap.DCPType)) {
    const get = object(object(object(dcpType)?.HTTP)?.Get);
    const onlineResource = object(get?.OnlineResource);
    const href = text(onlineResource?.["@_href"]);
    if (href) return href;
  }
}

function flattenLayers(layer: XmlObject, inheritedCrs: string[] = [], inheritedStyles: WmsStyle[] = []): WmsLayer[] {
  const crs = unique([...inheritedCrs, ...values(layer, "CRS"), ...values(layer, "SRS")]);
  const styles = uniqueStyles([...inheritedStyles, ...array(layer.Style).flatMap((style) => {
    const styleNode = object(style);
    const name = text(styleNode?.Name);
    return name ? [{ name, title: text(styleNode?.Title) }] : [];
  })]);
  const children = array(layer.Layer).flatMap((child) => {
    const childNode = object(child);
    return childNode ? flattenLayers(childNode, crs, styles) : [];
  });
  const name = text(layer.Name);
  const current = name ? [{
    name,
    title: text(layer.Title),
    abstract: text(layer.Abstract),
    crs,
    styles,
  }] : [];
  return [...current, ...children];
}

function uniqueStyles(styles: WmsStyle[]): WmsStyle[] {
  return styles.filter((style, index) => styles.findIndex(({ name }) => name === style.name) === index);
}

export function parseCapabilities(xml: string): ParsedWms {
  const valid = XMLValidator.validate(xml);
  if (valid !== true) throw new Error(`Invalid XML: ${valid.err.msg}`);

  const document = parser.parse(xml) as XmlObject;
  const root = object(document.WMS_Capabilities) ?? object(document.WMT_MS_Capabilities);
  if (!root) throw new Error("The document is not a WMS GetCapabilities response.");

  const version = text(root["@_version"]);
  const capability = object(root.Capability);
  const request = object(capability?.Request);
  const getMap = object(request?.GetMap);
  if (!version) throw new Error("The WMS capabilities document does not declare a version.");
  if (!getMap) throw new Error("This WMS service does not advertise a GetMap operation.");

  const getMapUrl = getMapEndpoint(getMap);
  if (!getMapUrl) throw new Error("The WMS GetMap operation has no HTTP GET endpoint.");

  const formats = unique(values(getMap, "Format"));
  if (!formats.length) throw new Error("The WMS GetMap operation does not advertise image formats.");

  const rootLayer = object(capability?.Layer);
  const layers = rootLayer ? flattenLayers(rootLayer) : [];
  if (!layers.length) throw new Error("The WMS capabilities document contains no selectable named layers.");

  return { version, getMapUrl, formats, layers };
}
