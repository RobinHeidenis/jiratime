import type { LinkMark, Mark } from "./marks.js";

export interface BlockQuoteNode {
  type: "blockquote";
  content: (
    | ParagraphNode
    | BulletListNode
    | OrderedListNode
    | CodeBlockNode
    | MediaGroupNode
    | MediaSingleNode
  )[];
}

export interface BulletListNode {
  type: "bulletList";
  content: ListItemNode[];
}

export interface CodeBlockNode {
  type: "codeBlock";
  attrs?: {
    language?: string;
  };
  content?: TextNode[];
}

export interface DateNode {
  type: "date";
  attrs: {
    timestamp: string;
  };
}

export interface EmojiNode {
  type: "emoji";
  attrs: {
    id?: string;
    shortName?: string;
    text: string;
  };
}

export interface ExpandNode {
  type: "expand";
  attrs: {
    title?: string;
  };
  content: (
    | BulletListNode
    | BlockQuoteNode
    | CodeBlockNode
    | HeadingNode
    | MediaGroupNode
    | MediaSingleNode
    | OrderedListNode
    | PanelNode
    | ParagraphNode
    | RuleNode
    | TableNode
    | NestedExpandNode
  )[];
  marks?: Mark[];
}

export interface HardBreakNode {
  type: "hardBreak";
  attrs?: {
    text?: string;
  };
}

export interface HeadingNode {
  type: "heading";
  attrs: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    localId?: string;
  };
  content?: InlineNode[];
}

export interface InlineCardNode {
  type: "inlineCard";
  attrs: {
    url?: string;
    data?: unknown;
  };
}

export interface ListItemNode {
  type: "listItem";
  content: (
    | BulletListNode
    | CodeBlockNode
    | MediaSingleNode
    | OrderedListNode
    | ParagraphNode
  )[];
}

export interface MediaNode {
  type: "media";
  attrs: {
    id: string;
    type: "file" | "link";
    collection: string;
    occurrenceKey?: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  marks: LinkMark[];
}

export interface MediaGroupNode {
  type: "mediaGroup";
  content: MediaNode[];
}

export interface MediaSingleNode {
  type: "mediaSingle";
  attrs: {
    layout:
      | "center"
      | "wrap-left"
      | "wrap-right"
      | "wide"
      | "full-width"
      | "align-start"
      | "align-end";
    width?: number;
    widthType?: "pixel" | "percentage";
  };
  content: MediaNode[];
}

export interface MentionNode {
  type: "mention";
  attrs: {
    id: string;
    text?: string;
    userType?: "DEFAULT" | "SPECIAL" | "APP";
    accessLevel?: "NONE" | "CONTAINER" | "SITE" | "APPLICATION";
  };
}

export interface NestedExpandNode {
  type: "nestedExpand";
  attrs: {
    title?: string;
  };
  content: (ParagraphNode | HeadingNode | MediaGroupNode | MediaSingleNode)[];
}

export interface OrderedListNode {
  type: "orderedList";
  attrs?: {
    order?: number;
  };
  content: ListItemNode[];
}

export interface PanelNode {
  type: "panel";
  attrs: {
    panelType: "info" | "note" | "warning" | "success" | "error";
  };
  content: (BulletListNode | HeadingNode | OrderedListNode | ParagraphNode)[];
}

export interface ParagraphNode {
  type: "paragraph";
  attrs?: {
    localId?: string;
  };
  content: InlineNode[]; // Any inline node
}

export interface RuleNode {
  type: "rule";
}

export interface StatusNode {
  type: "status";
  attrs: {
    text: string;
    color: "neutral" | "purple" | "blue" | "red" | "yellow" | "green";
    localId?: string;
  };
}

export interface TableNode {
  type: "table";
  attrs?: {
    isNumberColumnEnabled?: boolean;
    width?: number;
    layout?: "center" | "align-start";
    displayMode?: "default" | "fixed";
  };
  content: TableRowNode[];
}

export interface TableCellNode {
  type: "tableCell";
  attrs?: {
    background?: string;
    colwidth?: number[];
    colspan?: number;
    rowspan?: number;
  };
  content: (
    | BlockQuoteNode
    | BulletListNode
    | CodeBlockNode
    | HeadingNode
    | MediaGroupNode
    | NestedExpandNode
    | OrderedListNode
    | PanelNode
    | ParagraphNode
    | RuleNode
  )[];
}

export interface TableHeaderNode {
  type: "tableHeader";
  attrs?: {
    background?: string;
    colspan?: number;
    colwidth?: number[];
    rowspan?: number;
  };
  content: (
    | BlockQuoteNode
    | BulletListNode
    | CodeBlockNode
    | HeadingNode
    | MediaGroupNode
    | NestedExpandNode
    | OrderedListNode
    | PanelNode
    | ParagraphNode
    | RuleNode
  )[];
}

export interface TableRowNode {
  type: "tableRow";
  content: (TableCellNode | TableHeaderNode)[];
}

export interface TextNode {
  type: "text";
  text: string;
  marks?: Mark[];
}

export type TopLevelNode =
  | BlockQuoteNode
  | BulletListNode
  | CodeBlockNode
  | ExpandNode
  | HeadingNode
  | MediaGroupNode
  | MediaSingleNode
  | OrderedListNode
  | PanelNode
  | ParagraphNode
  | RuleNode
  | TableNode;

export type ChildBlockNode =
  | ListItemNode
  | MediaNode
  | NestedExpandNode
  | TableCellNode
  | TableHeaderNode
  | TableRowNode;

export type InlineNode =
  | DateNode
  | EmojiNode
  | HardBreakNode
  | InlineCardNode
  | MentionNode
  | StatusNode
  | TextNode;

export type Node = TopLevelNode | ChildBlockNode | InlineNode;
