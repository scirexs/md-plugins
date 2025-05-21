export {
  addIdToHeading2,
  setHeading2Meta,
  prepareCopyButton,
  addCopyCodeButton,
}

import type { Plugin } from "unified";
import type { Node, Parent, Literal } from "unist";
import type { Element } from "hast";
import type { VFile } from "vfile";
import type { H0, TOC, Raw } from "./types";
import { visit } from "unist-util-visit";
import { isParent, isElemHeading, isElemRaw, isCustomClassElement, addCustomMeta, getTextContent, getId, raw, isFirstTimeFactory } from "./utils.js";

const addIdToHeading2: Plugin = () => {
  return (tree: Node) => visit(tree, isHeading2, addHeadingId);
};
const setHeading2Meta: Plugin = () => {
  return (tree: Node, file: VFile) => {
    const toc: TOC[] = [];
    visit(tree, isHeading2, (node: H0) => collectHeading2Meta(node, toc));
    addCustomMeta(file, { toc });
  };
};
const prepareCopyButton: Plugin = () => {
  return (tree: Node) => {
    const isFirst = isFirstTimeFactory();
    visit(tree, isCodeWrapper, () => {
      if (isFirst()) prepCopyButton(tree);
    });
  };
};
const addCopyCodeButton: Plugin = () => {
  return (tree: Node) => visit(tree, isCodeWrapper, addCopyButton);
};

function isHeading2(node: unknown): node is H0 {
  return isElemHeading(node) && getHeadingLevel(node) === 2;
}
function getHeadingLevel(node: H0): number {
  return Number.parseInt(node.tagName.slice(-1));
}
function addHeadingId(node: H0) {
  node.properties.id = getTextContent(node).match(/[a-zA-Z0-9 ]+/g)?.join("").replaceAll(" ", "-").toLowerCase() ?? getId();
}
function collectHeading2Meta(node: H0, toc: TOC[]) {
  if (node.properties.id) toc.push({ id: node.properties.id as string, text: getTextContent(node) })
}

function isCodeWrapper(node: unknown): node is Element {
  return isCustomClassElement(node, "md-code-wrapper");
}

const IMPORT_COPYCODE = "import CopyCode from \"$lib/CopyCode.svelte\";";
function prepCopyButton(tree: Node) {
  if (!isParent(tree)) return;
  const script = seekRaw(tree, "<script", "</script>");
  if (!script) return addCopyButtonScript(tree);
  insertCopyButtonScript(script);
}
function addCopyButtonScript(tree: Parent) {
  const script = `<script>\n${IMPORT_COPYCODE}\n</script>`;
  tree.children.splice(0, 0, raw(script));
}
function insertCopyButtonScript(raw: Raw) {
  const match = /(^<script[^>]*>)/.exec(raw.value);
  if (!match) return;
  raw.value = raw.value.replace(match[1], `${match[1]}\n${IMPORT_COPYCODE}`);
}

function addCopyButton(node: Element) {
  const header = seekHeader(node);
  const code = seekRaw(node, "{@html", "}");
  if (!header || !code) return;
  const id = getId();
  addIdToCode(code, id);
  header.children.push(raw(`<CopyCode id=\"${id}\" />`))
}

function addIdToCode(node: Literal, id: string) {
  if (typeof node.value !== "string") return;
  const from = "<code>";
  const to = `<code id=\"${id}\">`;
  node.value = node.value.replace(from, to);
}
function seekHeader(node: Element): Element | undefined {
  for (const child of node.children) {
    if (isCustomClassElement(child, "md-code-header")) return child;
  }
}
function seekRaw(node: Node, start: string, end: string): Raw | undefined {
  if (!isParent(node)) return;
  for (const child of node.children) {
    if (isElemRaw(child) && child.value.startsWith(start) && child.value.endsWith(end)) return child;
  }
}

