import chalk from "chalk";

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

  public render(string: string) {
    const lines = string
      .replaceAll("’", "'")
      .replaceAll("‘", "'")
      .replaceAll("“", '"')
      .replaceAll("”", '"')
      .split("\n");
    const result: string[] = [];

    for (const line of lines) {
      result.push(...this.renderLine(line));
    }

    if (result.length < this.minimumLines) {
      result.push(
        ...Array(this.minimumLines - result.length).fill(
          "".padEnd(this.maxLineWidth, " "),
        ),
      );
    }

    return result.join("\n");
  }

  private pad(line: string) {
    const stringWithoutFormatting = line.replaceAll(ansiRegex(), "");
    const padding = " ".repeat(
      Math.max(0, this.maxLineWidth - stringWithoutFormatting.length),
    );

    return `${line}${padding}`;
  }

  private renderLine(line: string) {
    line = this.formatLine(line);
    const result: string[] = [];
    const words = line.split(" ");
    let currentLine = "";

    for (let word of words) {
      word = this.formatWord(word);
      if (
        this.getLength(currentLine) + this.getLength(word) + 1 <=
        this.maxLineWidth
      ) {
        currentLine += `${currentLine.length === 0 ? "" : " "}${word}`;
      } else {
        result.push(this.pad(currentLine));
        currentLine = word;
      }
    }

    result.push(this.pad(currentLine));

    return result;
  }

  private getLength(line: string) {
    return line.replaceAll(ansiRegex(), "").length;
  }

  private formatWord(word: string) {
    if (this.isSmartLink(word)) {
      return this.formatSmartLink(word);
    }

    if (this.isNormalLink(word)) {
      return this.formatNormalLink(word);
    }

    return word;
  }

  private formatLine(line: string): string {
    // Headings
    if (line.startsWith("h1. ")) {
      return `# ${line.slice(4)}`;
    }
    if (line.startsWith("h2. ")) {
      return `## ${line.slice(4)}`;
    }
    if (line.startsWith("h3. ")) {
      return `### ${line.slice(4)}`;
    }
    if (line.startsWith("h4. ")) {
      return `#### ${line.slice(4)}`;
    }
    if (line.startsWith("h5. ")) {
      return `##### ${line.slice(4)}`;
    }
    if (line.startsWith("h6. ")) {
      return `###### ${line.slice(4)}`;
    }

    while (line.includes("{{") && line.includes("}}")) {
      const start = line.indexOf("{{");
      const end = line.indexOf("}}");

      line = `${line.slice(0, start)}${chalk
        .hex("#FFA500")
        .bgGray(line.slice(start + 2, end))}${line.slice(end + 2)}`;
    }

    if (line.startsWith("!") && line.endsWith("!")) {
      return chalk.blue("Attachment");
    }

    return line;
  }

  private isSmartLink(word: string) {
    return (
      word.startsWith("[") && word.endsWith("]") && word.includes("|smart-link")
    );
  }

  private formatSmartLink(word: string) {
    return new URL(word.slice(1, word.indexOf("|"))).host.replace("www.", "");
  }

  private isNormalLink(word: string) {
    return word.startsWith("[") && word.endsWith("]") && word.includes("|");
  }

  private formatNormalLink(word: string) {
    const [text] = word.slice(1, -1).split("|");
    return chalk.blue(text);
  }
}
