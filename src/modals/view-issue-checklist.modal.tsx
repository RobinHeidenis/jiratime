import chalk from "chalk";
import { Box, Text } from "ink";
import { useAtomValue } from "jotai";
import { useGetIssueChecklistQuery } from "../api/get-checklist.query.js";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import { env } from "../env.js";
import { useIssue } from "../hooks/use-issue.js";
import { useKeybinds } from "../hooks/use-keybinds.js";
import { CLOSE_KEY } from "../lib/keybinds/keys.js";
import { pad } from "../lib/utils/pad.js";
import { splitIntoLines } from "../lib/utils/split-into-lines.js";
import { PaddedText } from "../padded-text.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

export const ViewIssueChecklistModal = ({
  onClose,
  issueId: issueIdOverride,
}: {
  onClose: () => void;
  issueId?: string | null;
}) => {
  const issue = useIssue(
    issueIdOverride ?? useAtomValue(highlightedIssueAtom).id,
  );
  const { data: checklist } = useGetIssueChecklistQuery(issue?.id!);

  const [columns] = useStdoutDimensions();

  useKeybinds(
    { view: "Checklist", unregister: true },
    (register) => {
      register({
        ...CLOSE_KEY,
        name: "Close",
        handler: onClose,
      });
    },
    [],
  );

  const width = 120;

  const items = checklist?.map((option) => {
    return {
      ...option,
      lines: splitIntoLines(option.summary, width - 7),
    };
  });

  const amountOfLines =
    items?.reduce((acc, item) => {
      return acc + item.lines.length;
    }, 0) || 0;

  return (
    <Box
      flexDirection="column"
      position="absolute"
      borderStyle={"round"}
      borderColor={env.theme.innerModalBorder}
      marginLeft={Math.floor((columns - width) / 2)}
      marginTop={Math.floor((50 - (1 + amountOfLines + 2)) / 2)}
      width={width + 2}
    >
      <PaddedText
        length={width}
        text=" Issue checklist"
        textProps={{ bold: true }}
      />
      {items?.map((option) => {
        if (option.lines[0]!.startsWith("---")) {
          return [
            <PaddedText key={`${option.id}-spacing`} length={width} />,
            ...option.lines.map((line, index) => (
              <Text key={`${option.id}-${index}`} bold>
                {index === 0 ? " " : "  "}
                {pad(line.replace("---", ""), width - 1)}
              </Text>
            )),
          ];
        }

        return option.lines.map((line, index) => (
          <Text key={`${option.id}-${index}`}>
            {" "}
            {index === 0 ? `[${option.fixed ? "x" : " "}] ` : "    "}
            {pad(option.fixed ? chalk.strikethrough(line) : line, width - 5)}
          </Text>
        ));
      })}
      <PaddedText length={width} />
    </Box>
  );
};
