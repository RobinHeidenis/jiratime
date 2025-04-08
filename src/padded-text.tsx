import { Text } from "ink";
import { pad } from "./lib/utils/pad.js";

export const PaddedText = ({
  text = "",
  length,
  textProps = {},
}: {
  text?: string;
  length: number;
  textProps?: Partial<Parameters<typeof Text>[0]>;
}) => {
  const padded = pad(text, length);

  return <Text {...textProps}>{padded}</Text>;
};
