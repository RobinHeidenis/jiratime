export interface BackgroundColorMark {
  type: "backgroundColor";
  attrs: {
    color: string;
  };
}

export interface CodeMark {
  type: "code";
}

export interface EmMark {
  type: "em";
}

export interface LinkMark {
  type: "link";
  attrs: {
    href: string;
    collection?: string;
    id?: string;
    occurrenceKey?: string;
    title?: string;
  };
}

export interface StrikeMark {
  type: "strike";
}

export interface StrongMark {
  type: "strong";
}

export interface SubSupMark {
  type: "subsup";
  attrs: {
    type: "sub" | "sup";
  };
}

export interface TextColorMark {
  type: "textColor";
  attrs: {
    color: string;
  };
}

export interface UnderlineMark {
  type: "underline";
}

export type Mark =
  | BackgroundColorMark
  | CodeMark
  | EmMark
  | LinkMark
  | StrikeMark
  | StrongMark
  | SubSupMark
  | TextColorMark
  | UnderlineMark;
