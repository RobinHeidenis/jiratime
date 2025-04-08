export const splitIntoLines = (text: string, maxLength = 80): string[] => {
  const lines: string[] = [];
  let currentLine = "";

  for (const word of text.split(" ")) {
    if (currentLine.length + word.length + 1 > maxLength) {
      lines.push(currentLine.trim());
      currentLine = " ";
    }
    currentLine += `${word} `;
  }

  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines.map((line, index) => (index === 0 ? line : ` ${line}`));
};
