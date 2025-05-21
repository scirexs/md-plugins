import type { Parent, Node } from "unist";
import type { Paragraph, Heading, Text, Code, Data, PhrasingContent, Html } from "mdast";
import type { Element } from "hast";
import { visit } from "unist-util-visit";
import { is } from "unist-util-is";
import { Section, HtmlObject, H0, Raw } from "./types";
import { VFile } from "vfile";

function isObject(v: unknown): v is Object {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isParent(node: unknown): node is Parent {
  return is(node) && "children" in node && Array.isArray(node.children);
}
function isParagraph(node: unknown): node is Paragraph {
  return isParent(node) && is(node, "paragraph");
}
function isHeading(node: unknown): node is Heading {
  return isParent(node) && is(node, "heading") && "depth" in node;
}
function isText(node: unknown): node is Text {
  return is(node, "text") && "value" in node && typeof node.value === "string";
}
function isCode(node: unknown): node is Code {
  return is(node, "code");
}
function isHtml(node: unknown): node is Html {
  return is(node, "html");
}
function isSection(node: unknown): node is Section {
  return is(node, "section") && isParent(node);
}
function isElemHeading(node: unknown): node is H0 {
  return is(node, "element") && "tagName" in node && typeof node.tagName === "string" && /^h[1-6]$/.test(node.tagName);
}
function isElemRaw(node: unknown): node is Raw {
  return is(node, "raw") && "value" in node;
}
function isCustomClassElement(node: unknown, className: string): node is Element {
  return is(node, "element")
    && "tagName" in node
    && "properties" in node
    && isObject(node.properties)
    && "className" in node.properties
    && node.properties.className === className
    && typeof node.tagName === "string"
    && node.tagName === "div";
}
function htmlObj(hName: string, className: string): HtmlObject {
  return { hName, hProperties: { className } };
}
function getTextContent(node: Parent): string {
  let text = "";
  visit(node, "text", (node: Text) => { text += node.value });
  return text;
}
function addCustomMeta(file: VFile, record: Record<string, unknown>) {
  file.data.fm = file.data.fm ? { ...file.data.fm, ...record } : { ...record };
}

function node(type: string, data: Data, children?: Node | Node[]): Node | Parent {
  if (children && !Array.isArray(children)) children = [children];
  return children ? { type, data, children } : { type, data };
}
function paragraph(data: Data, children: PhrasingContent | PhrasingContent[]): Paragraph {
  if (!Array.isArray(children)) children = [children];
  return {
    type: "paragraph",
    data,
    children,
  };
}
function text(value: string): Text {
  return { type: "text", value };
}
function html(value: string): Html {
  return { type: "html", value };
}
function raw(value: string): Raw {
  // @ts-ignore
  return { type: "raw", value };
}
function getIdFactory(): () => string {
  let n = 0;
  return () => `z${n++}`;
}
const getId = getIdFactory();
function isFirstTimeFactory(): () => boolean {
  let bool = true;
  return () => {
    if (bool) {
      bool = false;
      return true;
    }
    return false;
  };
}
export { isObject, isParent, isParagraph, isHeading, isText, isCode, isHtml, isSection, isElemHeading, isElemRaw, isCustomClassElement, htmlObj, getTextContent, addCustomMeta, node, paragraph, text, html, raw, getId, isFirstTimeFactory }
