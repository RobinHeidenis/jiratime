import { stringWidth } from "bun";

export const pad = (text: string, length: number) => {
  const currentLength = stringWidth(text);
  const paddingLength = length - currentLength;

  if (paddingLength <= 0) {
    return text;
  }

  const padding = " ".repeat(paddingLength);
  return text + padding;
};
