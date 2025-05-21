


// import { visit } from "unist-util-visit";
// import { h } from "hastscript";
// import type { Node, Plugin, Root, Paragraph, ContainerDirective, LeafDirective, TextDirective, DirectiveChild, Directives } from "./types.d.ts";

// export { details }

// const details: Plugin<[], Root> = () => {
//   return (tree: Root) => {
//     const TYPE = "details";
//     visit(tree, (node: Node) => {
//       const directive = isSpecificContainer(node, TYPE);
//       if (!directive) return;
//       const [summary, children] = getDetailsChildren(directive);
//       prepareHAST(directive, TYPE);
//       prepareDetails(directive, summary, children);
//     })
//   }
// }

// function getDetailsChildren(node: ContainerDirective): [string, DirectiveChild[]] {
//   const summary = getDetailsLabel(node)?.children.map((x) => {
//     if ("value" in x) { x.value }
//   }).join("") ?? "Details";
//   const children = node.children.filter((x) => {
//     if (!x.data) return true;
//     return "directiveLabel" in x.data ? !x.data.directiveLabel : true;
//   });
//   return [summary, children];
// }
// function getDetailsLabel(node: ContainerDirective): Paragraph | undefined {
//   return node.children.find((x) => {
//     x.type === "paragraph" &&
//     x.data?.directiveLabel &&
//     (x as Paragraph).children?.[0]?.type === "text"
//   }) as Paragraph | undefined;
// }

// function prepareDetails(node: ContainerDirective, summary: string, children: DirectiveChild[]): void {
//   node.data!.hChildren = [
//     h("summary", {}, summary),
//     ...children
//   ]
// }

// function isSpecificContainer(node: Node, name: string): node is ContainerDirective {
//   return isSpecificDirective(node, "containerDirective", name);
// }
// function isSpecificLeaf(node: Node, name: string): node is LeafDirective {
//   return isSpecificDirective(node, "leafDirective", name);
// }
// function isSpecificText(node: Node, name: string): TextDirective | undefined {
//   if (!isSpecificDirective(node, "textDirective", name)) return;
//   return node as TextDirective;
// }
// function isSpecificDirective(node: Node, type: string, name: string): boolean {
//   if (node.type !== type) return false;
//   const [dName, ...args] = (node as Directives).name.split(" ");
//   return node.type === type && (node as Directives).name === name;
// }
// function prepareHAST(node: Directives, type: string): Directives {
//   if (!node.data) node.data = {};
//   node.data.hName = type;
//   return node;
// }

