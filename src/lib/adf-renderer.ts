import chalk from "chalk";
import terminalLink from "terminal-link";
import wrapAnsi from "wrap-ansi";

export const ansiRegex = ({ onlyFirst = false } = {}) => {
  // Valid string terminator sequences are BEL, ESC\, and 0x9c
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
  ].join("|");

  return new RegExp(pattern, onlyFirst ? undefined : "g");
};

enum HeadingLevel {
  H1 = 1,
  H2 = 2,
  H3 = 3,
  H4 = 4,
  H5 = 5,
  H6 = 6,
}

export class ADFRenderer {
  private static readonly HEADING_PREFIX = "h";
  private static readonly HEADING_SUFFIX = ". ";
  private static readonly CODE_BLOCK_MARKER = "{{";
  private static readonly CODE_BLOCK_END = "}}";
  private static readonly IMAGE_MARKER = "!";
  private static readonly SMART_LINK_IDENTIFIER = "|smart-link";
  private static readonly BOLD_MARKER = "*";
  private static readonly STRIKETHROUGH_MARKER = "-";

  constructor(
    private readonly maxLineWidth: number,
    private readonly minimumLines: number,
  ) {}

  public render(text: string): string[] {
    const normalizedText = this.normalizeQuotes(text);
    const lines = this.processLines(normalizedText.split("\n"));
    return this.padToMinimumLines(lines);
  }

  private normalizeQuotes(text: string): string {
    const replacements = new Map([
      ["’", "'"],
      ["‘", "'"],
      ["“", '"'],
      ["”", '"'],
    ]);

    return Array.from(replacements.entries()).reduce(
      (acc, [from, to]) => acc.replaceAll(from, to),
      text,
    );
  }

  private processLines(lines: string[]): string[] {
    const renderedLines = lines.flatMap((line) => {
      // If the line is empty, return a single empty line (padded to width)
      if (line.trim() === "") {
        return [this.pad("")];
      }
      return this.renderLine(line);
    });

    renderedLines.push(this.pad("")); // Add an empty line at the end
    return renderedLines;
  }

  private padToMinimumLines(lines: string[]): string[] {
    if (lines.length >= this.minimumLines) {
      return lines;
    }

    const padding = Array(this.minimumLines - lines.length).fill(
      "".padEnd(this.maxLineWidth, " "),
    );

    return [...lines, ...padding];
  }

  private isListItem(line: string): { isList: boolean; level: number } {
    const match = line.match(/^(\*+)\s/);
    if (!match) return { isList: false, level: 0 };
    return { isList: true, level: match[1]!.length };
  }

  private processBoldText(text: string): string {
    let result = text;
    const starPositions: number[] = [];

    // Find all star positions
    let pos = 0;
    while ((pos = result.indexOf(ADFRenderer.BOLD_MARKER, pos)) !== -1) {
      starPositions.push(pos);
      pos++;
    }

    // Process pairs of stars from right to left
    for (let i = starPositions.length - 1; i > 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        // Check if this pair of stars is already processed
        if (
          result[starPositions[i]!] === ADFRenderer.BOLD_MARKER &&
          result[starPositions[j]!] === ADFRenderer.BOLD_MARKER
        ) {
          // Extract the text between stars
          const beforeStar = result.substring(0, starPositions[j]);
          const betweenStars = result.substring(
            starPositions[j]! + 1,
            starPositions[i],
          );
          const afterStar = result.substring(starPositions[i]! + 1);

          // Replace with bold text
          result = beforeStar + chalk.bold(betweenStars) + afterStar;

          // Mark these stars as processed by removing them from future consideration
          starPositions[i] = -1;
          starPositions[j] = -1;
          break;
        }
      }
    }

    return result;
  }

  private processStrikethrough(text: string): string {
    let result = text;
    const strikePositions: number[] = [];

    // Find valid strike positions (preceded by space or start of line)
    let pos = 0;
    while ((pos = result.indexOf("-", pos)) !== -1) {
      // Check if dash is at start of line or preceded by space
      const isValidStart = pos === 0 || result[pos - 1] === " ";
      // Skip if we're inside a link
      const beforeText = result.substring(0, pos);
      const openBrackets = (beforeText.match(/\[/g) || []).length;
      const closeBrackets = (beforeText.match(/\]/g) || []).length;
      const isInsideLink = openBrackets > closeBrackets;

      if (isValidStart && !isInsideLink) {
        strikePositions.push(pos);
      }
      pos++;
    }

    // Process pairs of dashes from right to left
    for (let i = strikePositions.length - 1; i > 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        // Check if this pair of dashes is already processed
        if (
          result[strikePositions[i]!] === "-" &&
          result[strikePositions[j]!] === "-"
        ) {
          // Verify the ending dash is followed by space or end of line
          const isValidEnd =
            strikePositions[i] === result.length - 1 ||
            result[strikePositions[i]! + 1] === " " ||
            result[strikePositions[i]! + 1] === "\n";

          if (isValidEnd) {
            // Extract the text between dashes
            const beforeStrike = result.substring(0, strikePositions[j]);
            const betweenStrikes = result.substring(
              strikePositions[j]! + 1,
              strikePositions[i],
            );
            const afterStrike = result.substring(strikePositions[i]! + 1);

            // Replace with strikethrough text
            result =
              beforeStrike + chalk.strikethrough(betweenStrikes) + afterStrike;

            // Mark these dashes as processed
            strikePositions[i] = -1;
            strikePositions[j] = -1;
            break;
          }
        }
      }
    }

    return result;
  }
  private renderLine(line: string): string[] {
    const { isList, level } = this.isListItem(line);

    if (isList) {
      // Handle list items
      const content = line.substring(level + 1); // Remove stars and first space
      const indentation = "⠀⠀".repeat(level - 1);
      const bulletPoint = "•";
      const formattedContent = this.formatLine(
        this.processStrikethrough(this.processBoldText(content)),
      );
      const formattedLine = `${indentation}${bulletPoint} ${formattedContent}`;
      return this.wrapText(formattedLine);
    }

    // Handle regular lines with potential bold text
    const formattedLine = this.formatLine(
      this.processStrikethrough(this.processBoldText(line)),
    );
    return this.wrapText(formattedLine);
  }

  private wrapText(line: string): string[] {
    const formattedLine = line
      .split(" ")
      .map((word) => this.formatWord(word))
      .join(" ");
    //
    // Use wrap-ansi to properly wrap while preserving ANSI codes
    const wrapped = wrapAnsi(formattedLine, this.maxLineWidth, {
      hard: true,
      wordWrap: true,
      trim: false,
    });

    // Split into lines and pad each one
    return wrapped.split("\n").map((line) => this.pad(line));
  }

  private formatLine(line: string): string {
    const headingLevel = this.getHeadingLevel(line);
    if (headingLevel) {
      return this.formatHeading(line, headingLevel);
    }

    if (this.isImage(line)) {
      return this.formatImage(line);
    }

    return this.formatCodeBlocks(line);
  }

  private getHeadingLevel(line: string): HeadingLevel | null {
    for (let level = HeadingLevel.H1; level <= HeadingLevel.H6; level++) {
      const prefix = `${ADFRenderer.HEADING_PREFIX}${level}${ADFRenderer.HEADING_SUFFIX}`;
      if (line.startsWith(prefix)) {
        return level;
      }
    }
    return null;
  }

  private formatHeading(line: string, level: HeadingLevel): string {
    const prefix = `${ADFRenderer.HEADING_PREFIX}${level}${ADFRenderer.HEADING_SUFFIX}`;
    const content = line.slice(prefix.length);
    return `${"#".repeat(level)} ${content}`;
  }

  private isImage(line: string): boolean {
    return (
      line.startsWith(ADFRenderer.IMAGE_MARKER) &&
      line.endsWith(ADFRenderer.IMAGE_MARKER)
    );
  }

  private formatImage(line: string): string {
    const content = line.slice(1, -1);
    return chalk.bgYellow(chalk.black(content));
  }

  private formatCodeBlocks(line: string): string {
    while (
      line.includes(ADFRenderer.CODE_BLOCK_MARKER) &&
      line.includes(ADFRenderer.CODE_BLOCK_END)
    ) {
      const start = line.indexOf(ADFRenderer.CODE_BLOCK_MARKER);
      const end = line.indexOf(ADFRenderer.CODE_BLOCK_END);
      const code = line.slice(start + 2, end);

      line = [
        line.slice(0, start),
        chalk.hex("#FF6188").bgHex("#2E3035")(code),
        line.slice(end + 2),
      ].join("");
    }
    return line;
  }

  private formatWord(word: string): string {
    if (this.isSmartLink(word)) {
      return this.formatSmartLink(word);
    }
    if (this.isNormalLink(word)) {
      return this.formatNormalLink(word);
    }
    return word;
  }

  private isSmartLink(word: string): boolean {
    return (
      word.startsWith("[") &&
      word.endsWith("]") &&
      word.includes(ADFRenderer.SMART_LINK_IDENTIFIER)
    );
  }

  private isNormalLink(word: string): boolean {
    return word.startsWith("[") && word.endsWith("]") && word.includes("|");
  }

  private formatSmartLink(word: string): string {
    const url = word.slice(1, word.indexOf("|"));
    try {
      return chalk.underline.blue(
        terminalLink(new URL(url).host.replace("www.", ""), url),
      );
    } catch {
      return url; // Return original URL if parsing fails
    }
  }

  private formatNormalLink(word: string): string {
    try {
      const [text, url] = word.slice(1, -1).split("|");
      return chalk.underline.blue(terminalLink(text!, url!));
    } catch {
      return word; // Return original word if parsing fails
    }
  }

  private pad(line: string): string {
    const cleanLength = this.getLength(line);
    const padding = " ".repeat(Math.max(0, this.maxLineWidth - cleanLength));
    return `${line}${padding}`;
  }

  private getLength(line: string): number {
    return line.replace(ansiRegex(), "").length;
  }
}
