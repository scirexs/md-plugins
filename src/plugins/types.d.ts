import type { Parent, Text } from "mdast";
import type { Element } from "hast";

interface Section extends Parent {
    type: "section";
    children: Text[];
}
interface H0 extends Element {
  tagName: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}
interface HtmlObject {
  hName: string;
  hProperties: {
    className: string;
  };
}
interface TOC {
  id: string;
  text: string;
}
interface Raw extends Element {
  value: string;
}
