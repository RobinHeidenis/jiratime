import chalk, { type ChalkInstance } from "chalk";
import { format } from "date-fns";
import terminalLink from "terminal-link";
import wrapAnsi from "wrap-ansi";
import { env } from "../env.js";
import type { Mark } from "./marks.js";
import type {
  BlockQuoteNode,
  BulletListNode,
  CodeBlockNode,
  DateNode,
  EmojiNode,
  ExpandNode,
  HardBreakNode,
  HeadingNode,
  InlineCardNode,
  InlineNode,
  ListItemNode,
  MediaGroupNode,
  MediaNode,
  MediaSingleNode,
  MentionNode,
  NestedExpandNode,
  OrderedListNode,
  PanelNode,
  ParagraphNode,
  RuleNode,
  StatusNode,
  TableCellNode,
  TableHeaderNode,
  TableNode,
  TableRowNode,
  TextNode,
  TopLevelNode,
} from "./nodes.js";

export const ansiRegex = ({ onlyFirst = false } = {}) => {
  // Valid string terminator sequences are BEL, ESC\, and 0x9c
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
  ].join("|");

  return new RegExp(pattern, onlyFirst ? undefined : "g");
};

export class ADFRenderer {
  constructor(
    private readonly maxLineWidth: number,
    private readonly minimumLines: number,
  ) {}

  public render(adf: TopLevelNode[]) {
    const preProcessedAdf = adf.reduce((acc, node, index) => {
      if (index > 0 && acc[acc.length - 1]?.type === "paragraph") {
        if (node.type !== "paragraph") {
          acc.push({ type: "paragraph", content: [] });
        }
      }

      acc.push(node);
      return acc;
    }, [] as TopLevelNode[]);

    const lines = preProcessedAdf
      .flatMap((node) => this.renderTopLevelNode(node))
      .map((line) => this.pad(line));

    if (lines.length < this.minimumLines) {
      lines.push(...Array(this.minimumLines - lines.length).fill(this.pad("")));
    }

    return lines;
  }

  public renderTopLevelNode(node: TopLevelNode): string[] {
    if (!node || typeof node !== "object" || !("type" in node)) {
      return [];
    }

    switch (node.type) {
      case "blockquote":
        return this.blockQuote(node);
      case "bulletList":
        return this.bulletList(node);
      case "codeBlock":
        return this.codeBlock(node);
      case "expand":
        return this.expand(node);
      case "heading":
        return this.heading(node);
      case "mediaGroup":
        return [];
      case "mediaSingle":
        return this.mediaSingle(node);
      case "orderedList":
        return this.orderedList(node);
      case "panel":
        return this.panel(node);
      case "paragraph":
        return this.paragraph(node);
      case "rule":
        return this.rule(node);
      case "table":
        return [];
    }
  }

  public renderInlineNodes(nodes: InlineNode[]): string {
    if (!nodes) {
      return "";
    }

    let string = "";

    for (const node of nodes) {
      switch (node.type) {
        case "date":
          string += this.date(node);
          break;
        case "emoji":
          string += this.emoji(node);
          break;
        case "hardBreak":
          string += this.hardBreak(node);
          break;
        case "inlineCard":
          string += this.inlineCard(node);
          break;
        case "mention":
          string += this.mention(node);
          break;
        case "status":
          string += this.status(node);
          break;
        case "text":
          string += this.text(node);
          break;
      }
    }

    return string;
  }

  public pad(line: string, maxLength = this.maxLineWidth): string {
    const cleanLength = this.getLength(line);
    const padding = " ".repeat(Math.max(0, maxLength - cleanLength));
    return `${line}${padding}`;
  }

  private blockQuote(node: BlockQuoteNode) {
    const renderer = new ADFRenderer(this.maxLineWidth - 2, this.minimumLines);
    return node.content.flatMap((content) =>
      renderer
        .renderTopLevelNode(content)
        .flatMap((line) => `${chalk.white.dim("> ")}${line}`),
    );
  }

  private bulletList(node: BulletListNode, level = 0): string[] {
    const nodes = node.content.flatMap((li) => {
      return this.listItem(li, level);
    });

    if (level === 0) {
      nodes.push(this.pad(""));
    }

    return nodes;
  }

  private codeBlock(node: CodeBlockNode) {
    const textContent =
      node.content?.flatMap((content) => {
        return content.text.split("\n");
      }) ?? [];
    const maxLineNumber = (textContent ?? []).length.toString().length;
    const maxLineLength = Math.max(
      ...(textContent?.map((line) => line.length) ?? []),
    );

    const nodes =
      textContent.map((line, i) => {
        const lineNumber = `${i + 1}`.padStart(maxLineNumber, "⠀");
        return this.pad(
          chalk.bgHex("#364153")(
            ` ${chalk.gray(lineNumber)} ${line.padEnd(maxLineLength, " ")} `,
          ),
        );
      }) ?? [];

    nodes.push(this.pad(""));

    return nodes;
  }

  private date(node: DateNode) {
    const date = new Date(Number(node.attrs.timestamp));
    return chalk.bgGray(format(date, "MMM dd, yyyy"));
  }

  private emoji(node: EmojiNode): string {
    return node.attrs.text ?? node.attrs.shortName ?? "";
  }

  private expand(node: ExpandNode): string[] {
    const renderer = new ADFRenderer(this.maxLineWidth - 2, this.minimumLines);
    const nodes = node.content
      .flatMap((content) => {
        if (content.type === "nestedExpand") {
          return this.nestedExpand(content);
        }
        return renderer.renderTopLevelNode(content);
      })
      .map((line) => `  ${line}`);

    nodes.unshift(
      this.pad(
        `\uf078 ${this.wrapWithMarkStyling(node.attrs.title || "Expand", node.marks)}`,
      ),
    );
    nodes.push(this.pad(""));

    return nodes;
  }

  private hardBreak(node: HardBreakNode): string {
    return `${node.attrs?.text ?? ""}\n`;
  }

  private heading(node: HeadingNode): string[] {
    if (!node.content) {
      return [];
    }

    return [
      `${"#".repeat(node.attrs.level)} ${this.renderInlineNodes(node.content)}`,
      "",
    ];
  }

  // Smart link
  private inlineCard(node: InlineCardNode): string {
    const url = node.attrs.url;

    if (!url) return typeof node.attrs.data === "string" ? node.attrs.data : "";

    return chalk.underline.blue(
      terminalLink(
        url.includes(env.JIRA_BASE_URL)
          ? url.split("/").at(-1)!
          : new URL(url).hostname.replace("www.", ""),
        url,
      ),
    );
  }

  private listItem(
    node: ListItemNode,
    level = 0,
    options?: {
      ordered?: boolean;
      number?: number;
    },
  ): string[] {
    if (!node.content) {
      return [];
    }

    const nodes: string[] = [];
    for (const content of node.content) {
      if (content.type === "bulletList") {
        nodes.push(...this.bulletList(content, level + 1));
      } else if (content.type === "orderedList") {
        nodes.push(...this.orderedList(content, level + 1));
      } else if (content.type === "paragraph") {
        // Create level indicators with gray bullets
        const levelIndicators =
          level > 0 ? `${chalk.hex("#404040")("• ".repeat(level))}` : "";

        // Calculate prefix based on whether it's ordered or unordered
        let prefix: string;
        if (options?.ordered) {
          // For ordered lists, include the number
          const numberStr = `${options.number}.`;
          prefix = ` ${levelIndicators}${numberStr} `;
        } else {
          // For unordered lists, use bullet point
          prefix = ` ${levelIndicators}• `;
        }

        const indentation = " ".repeat(prefix.length);
        const text = this.renderInlineNodes(content.content || []);

        // Calculate available width for text
        const availableWidth = this.maxLineWidth - prefix.length;

        // Wrap the text
        const wrapped = wrapAnsi(text, availableWidth, {
          hard: true,
          wordWrap: true,
          trim: false,
        });

        // Process wrapped lines
        const lines = wrapped.split("\n");
        if (lines.length > 0) {
          // First line gets the number/bullet with level indicators
          nodes.push(`${prefix}${lines[0]}`);

          // Subsequent lines get indentation
          for (let i = 1; i < lines.length; i++) {
            nodes.push(`${indentation}${lines[i]}`);
          }
        }
      } else if (content.type === "mediaSingle") {
        nodes.push(
          ...this.mediaSingle(content).map(
            (line) => ` ${"  ".repeat(level)} ${line}`,
          ),
        );
      } else if (content.type === "codeBlock") {
        const lines = this.codeBlock(content);
        const firstLine = lines.shift();
        const prefix = ` ${"  ".repeat(level)} `;
        nodes.push(`${prefix}• ${firstLine!.trim()}`);
        nodes.push(
          ...lines.map((line) => ` ${"  ".repeat(level + 1)} ${line.trim()}`),
        );
      } else {
        nodes.push("UNSUPPORTED ELEMENT");
      }
    }

    return nodes;
  }

  private media(node: MediaNode) {
    return chalk.bgYellow.black(node.attrs.alt ?? node.attrs.id ?? "MEDIA");
  }

  private mediaGroup(node: MediaGroupNode) {}

  private mediaSingle(node: MediaSingleNode): string[] {
    if (!node.content) {
      return [];
    }

    return node.content.map((media) => {
      return this.media(media);
    });
  }

  private mention(node: MentionNode): string {
    return node.attrs.text ?? `@${node.attrs.id}`;
  }

  private nestedExpand(node: NestedExpandNode): string[] {
    const renderer = new ADFRenderer(this.maxLineWidth - 5, this.minimumLines);
    const nodes = node.content
      .flatMap((content) => {
        return renderer.renderTopLevelNode(content);
      })
      .map((line) => `   ${line}`);

    nodes.unshift(renderer.pad(` \uf078 ${node.attrs.title || "Expand"}`));

    return nodes;
  }

  private orderedList(node: OrderedListNode, level = 0): string[] {
    const startNumber = node.attrs?.order || 1;
    return node.content.flatMap((li, index) => {
      return this.listItem(li, level, {
        ordered: true,
        number: startNumber + index,
      });
    });
  }

  private panel(node: PanelNode): string[] {
    const renderer = new ADFRenderer(this.maxLineWidth - 4, this.minimumLines);
    const panelContent = node.content.flatMap((content) => {
      return renderer.renderTopLevelNode(content);
    });

    const maxContentLength = Math.max(
      ...(panelContent.map((content) => this.getLength(content)) ?? []),
    );

    const iconMap = {
      info: "\uf05a",
      note: "\uf15c",
      warning: "\uf071",
      success: "\uf058",
      error: "\uf530",
    } satisfies Record<PanelNode["attrs"]["panelType"], string>;

    const colorMap = {
      info: chalk.bgHex("#155dfc"),
      note: chalk.bgHex("#ad46ff"),
      warning: chalk.bgHex("#fd9a00").black,
      success: chalk.bgHex("#497D00"),
      error: chalk.bgRedBright,
    } satisfies Record<PanelNode["attrs"]["panelType"], ChalkInstance>;

    panelContent.unshift(
      `${iconMap[node.attrs.panelType]} ${node.attrs.panelType.slice(0, 1).toUpperCase()}${node.attrs.panelType.slice(1)}`,
    );
    const nodes = panelContent.map((content) => {
      return colorMap[node.attrs.panelType](
        ` ${this.pad(content, maxContentLength)} `,
      );
    });

    nodes.push(this.pad(""));

    return nodes;
  }

  private paragraph(node: ParagraphNode): string[] {
    if (!node.content) {
      return [];
    }

    const text = this.renderInlineNodes(node.content);
    const wrapped = wrapAnsi(text, this.maxLineWidth, {
      hard: true,
      wordWrap: true,
      trim: false,
    });
    return wrapped.split("\n");
  }

  private rule(_node: RuleNode): string[] {
    return [chalk.gray.strikethrough(this.pad(""))];
  }

  private status(node: StatusNode): string {
    const colorMap = {
      neutral: chalk.bgGray,
      purple: chalk.bgMagenta.black,
      blue: chalk.bgBlue,
      red: chalk.bgRed,
      yellow: chalk.bgYellow.black,
      green: chalk.bgGreen.black,
    } satisfies Record<StatusNode["attrs"]["color"], ChalkInstance>;

    return colorMap[node.attrs.color](` ${node.attrs.text} `);
  }

  private table(node: TableNode) {}

  private tableCell(node: TableCellNode) {}

  private tableHeader(node: TableHeaderNode) {}

  private tableRow(node: TableRowNode) {}

  private text(node: TextNode) {
    return this.wrapWithMarkStyling(node.text, node.marks);
  }

  private wrapWithMarkStyling(text: string, marks: Mark[] = []): string {
    let markedText = text;

    for (const mark of marks) {
      switch (mark.type) {
        case "underline":
          markedText = chalk.underline(markedText);
          break;
        case "strong":
          markedText = chalk.bold(markedText);
          break;
        case "em":
          markedText = chalk.italic(markedText);
          break;
        case "strike":
          markedText = chalk.strikethrough(markedText);
          break;
        case "textColor":
          markedText = chalk.hex(mark.attrs.color)(markedText);
          break;
        case "backgroundColor":
          markedText = chalk.bgHex(mark.attrs.color)(markedText);
          break;
        case "link":
          markedText = chalk.underline.blue(
            terminalLink(markedText, mark.attrs.href),
          );
          break;
        case "code":
          markedText = chalk.hex("#FF6188").bgHex("#2E3035")(markedText);
          break;
      }
    }

    return markedText;
  }

  private getLength(line: string): number {
    return line.replaceAll(ansiRegex(), "").length;
  }
}
