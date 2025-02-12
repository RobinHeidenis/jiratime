import { Box, Text } from "ink";
import React from "react";

const priorityMap: Record<string, Parameters<typeof Text>[0]["color"]> = {
  Blocker: "redBright",
  High: "red",
  Medium: "yellow",
  Low: "blueBright",
};

export const Issue = ({
  name,
  issueNumber,
  storyPoints,
  assigneeName,
  priority,
}: {
  name: string;
  issueNumber: string;
  storyPoints: number | null;
  assigneeName: string;
  priority: string;
}) => {
  return (
    <Box
      borderStyle={"round"}
      width={"100%"}
      flexDirection="column"
      paddingX={1}
      flexShrink={0}
    >
      <Text>{name}</Text>
      <Box justifyContent="space-between" marginTop={1}>
        <Box flexDirection="column">
          <Text>
            {"\uf292"} {issueNumber}
          </Text>
          <Text>
            {"\uf43a"} {storyPoints !== null ? storyPoints : "N/A"}
          </Text>
        </Box>
        <Box flexDirection="column" alignItems="flex-start">
          <Text>
            {"\uf007"} {assigneeName.split(" ")[0]}
          </Text>
          <Text color={priorityMap[priority] ?? "yellow"}>
            {"\uf161"} {priority}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
