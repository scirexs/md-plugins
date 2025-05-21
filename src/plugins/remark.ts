export {
  replaceSection,
  setSectionMeta,
  setHeading1Meta,
  setDescriptionMeta,
  wrapCode,
  prepareTabs,
  replaceTabs,
}

import type { Plugin } from "unified";
import type { Node, Parent } from "unist";
import type { Paragraph, Heading, Text, Code, Html } from "mdast";
import type { VFile } from "vfile";
import type { Section } from "./types";
import { visit } from "unist-util-visit";
import { isParagraph, isHeading, isParent, isText, isCode, isHtml, isSection, htmlObj, getTextContent, addCustomMeta, getId, node, paragraph, text, html, isFirstTimeFactory } from "./utils.js";

const TOKEN_SECTION = "::section ";
const OPEN_TABS = ":::tabs ";
const CLOSE_TOKEN = ":::";

const replaceSection: Plugin = () => {
  return (tree: Node) => visit(tree, isSectionParagraph, toSection);
};
const setSectionMeta: Plugin = () => {
  return (tree: Node, file: VFile) => visit(tree, isSection, (node: Section) => {
    const section = getTextContent(node);
    addCustomMeta(file, { section });
  });
};
const setHeading1Meta: Plugin = () => {
  return (tree: Node, file: VFile) => visit(tree, isHeading1, (node: Heading) => addHeading1Meta(node, file));
};
const setDescriptionMeta: Plugin = () => {
  return (tree: Node, file: VFile) => {
    const isFirst = isFirstTimeFactory();
    visit(tree, isParagraph, (node: Paragraph) => {
      if (isFirst()) addCustomMeta(file, { description: getTextContent(node) });
    });
  };
};
const wrapCode: Plugin = () => {
  return (tree: Node) => visit(tree, isCode, toWrapCode);
};
const prepareTabs: Plugin = () => {
  return (tree: Node) => {
    const isFirst = isFirstTimeFactory();
    visit(tree, isOpenTabs, () => {
      if (isFirst()) prepTabs(tree);
    });
  };
};
const replaceTabs: Plugin = () => {
  return (tree: Node) => createTabsNode(tree);
};

function isSectionParagraph(node: unknown): node is Paragraph {
  if (!isParagraph(node)) return false;
  const child = node.children[0];
  return isText(child) && child.value.startsWith(TOKEN_SECTION);
}
function toSection(node: Paragraph, index?: number, parent?: Parent) {
  if (!isParent(parent) || index === undefined) return;
  const child = node.children[0] as Text;
  if (!child.value.includes("\n")) {
    parent.children[index] = createSection(child.value);
    return;
  }
  const [token, ...rest] = child.value.split("\n");
  child.value = rest.join("\n");
  parent.children.splice(index, 0, createSection(token));
}
function createSection(value: string): Parent {
  return node("section", htmlObj("div", "md-section"), getSectionText(value)) as Parent;
}
function getSectionText(value: string): Text {
  return text(value.replace(TOKEN_SECTION, ""));
}

function isHeading1(node: unknown): node is Heading {
  return isHeading(node) && node.depth === 1;
}
function addHeading1Meta(node: Heading, file: VFile) {
  // @ts-ignore
  const slug = file.filename?.split("/")?.pop()?.replace(".sv.md", "") ?? "default";
  addCustomMeta(file, {
    title: getTextContent(node),
    slug,
    path: `/docs/${slug}`,
  });
}

function toWrapCode(node: Code, index?: number, parent?: Parent) {
  if (!isParent(parent) || index === undefined) return;
  const wrapper = createWrapper(node);
  parent.children[index] = wrapper;
}
function createWrapper(code: Code): Parent {
  return node(
    "container",
    htmlObj("div", "md-code-wrapper"),
    [createHeader(getTitle(code)), code]) as Parent;
}
function createHeader(title: Text): Parent {
  return node(
    "header",
    htmlObj("div", "md-code-header"),
    paragraph(htmlObj("div", "md-code-title"), title)) as Parent;
}
function getTitle(node: Code): Text {
  if (!node.lang) return text("text");
  if (!node.lang.includes(":")) return text(translateLang(node.lang));
  const [lang, ...others] = node.lang.split(":");
  node.lang = lang;
  return text(others.join(":"));
}
function translateLang(lang: string): string {
  switch (lang) {
    case "ts": return "TypeScript";
    case "sh": return "Shell";
    case "css": return "Stylesheet";
    case "html": return "HTML";
  }
  return lang;
}

const IMPORT_TABS = "import { Tabs } from \"svseeds\";\nlet current = $state();";
function prepTabs(tree: Node) {
  if (!isParent(tree)) return;
  const script = seekHtml(tree, "<script", "</script>");
  if (!script) return addTabsScript(tree);
  insertTabsScript(script);
}
function addTabsScript(tree: Parent) {
  tree.children.splice(0, 0, html(`<script>\n${IMPORT_TABS}\n</script>`));
}
function insertTabsScript(node: Html) {
  const match = /(^<script[^>]*>)/.exec(node.value);
  if (!match) return;
  node.value = node.value.replace(match[1], `${match[1]}\n${IMPORT_TABS}`);
}
function seekHtml(node: Node, start: string, end: string): Html | undefined {
  if (!isParent(node)) return;
  for (const child of node.children) {
    if (isHtml(child) && child.value.startsWith(start) && child.value.endsWith(end)) return child;
  }
}

function createTabsNode(tree: Node) {
  if (!isParent(tree)) return;
  let inner = false;
  let i = 0;
  while (tree.children[i]) {
    if (!inner) {
      inner = seekOpenTabs(tree, i);
    } else {
      inner = !seekCloseTabs(tree, i);
      if (inner && !isHtml(tree.children[i])) {
        tree.children.splice(i + 1, 0, nodeTabsCloseSnippet());
        tree.children.splice(i, 0, nodeTabsOpenSnippet());
        i += 2;
      }
    }
    i++;
  }
}
function seekOpenTabs(tree: Parent, index: number): boolean {
  if (!isOpenTabs(tree.children[index])) return false;
  tree.children[index] = nodeOpenTabs(getTextContent(tree.children[index]));
  return true;
}
function isOpenTabs(child: Node): child is Paragraph {
  if (!isParagraph(child)) return false;
  return getTextContent(child).startsWith(OPEN_TABS);
}
function nodeOpenTabs(label: string): Html {
  const labels = "[" + label.replace(OPEN_TABS, "").split(",").map((x) => `"${x}"`).join(",") + "]";
  return html(`<Tabs labels={${labels}} bind:current orientation="horizontal">`);
}
function seekCloseTabs(tree: Parent, index: number): boolean {
  if (!isCloseTabs(tree.children[index])) return false;
  tree.children[index] = nodeCloseTabs();
  return true;
}
function isCloseTabs(child: Node): child is Paragraph {
  if (!isParagraph(child)) return false;
  return getTextContent(child).startsWith(CLOSE_TOKEN);
}
function nodeCloseTabs(): Html {
  return html("</Tabs>");
}
function nodeTabsOpenSnippet(): Html {
  return html(`{#snippet panel${getId()}()}`);
}
function nodeTabsCloseSnippet(): Html {
  return html("{/snippet}");
}
