import { Box, Text, useInput } from "ink";
import React from "react";
import type { z } from "zod";
import type { issue as issueSchema } from "./api/issue-query.js";
import { priorityMap } from "./issue.js";
import { ADFRenderer } from "./lib/adf-renderer.js";
import { PaddedText } from "./padded-text.js";
import { useStdoutDimensions } from "./useStdoutDimensions.js";

export const ViewIssueModal = ({
  issue,
  onClose,
}: { issue: z.infer<typeof issueSchema>; onClose: () => void }) => {
  const [columns, rows] = useStdoutDimensions();

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      onClose();
    }
  });

  // title/description + outer borders + assignees + assignee borders
  const width = 122 + 2 + 20 + 2;

  const text = new ADFRenderer(120, 33).render(
    issue.fields.description ?? "No description.",
  );

  return (
    <Box
      flexDirection="row"
      position="absolute"
      borderStyle={"round"}
      borderColor={"greenBright"}
      height={40}
      marginLeft={(columns - width) / 2}
      marginTop={(rows - 50) / 2}
    >
      <Box flexDirection="column">
        <Box borderStyle={"round"} borderColor={"green"} width={122}>
          <Text>{issue.fields.summary.padEnd(120, " ")}</Text>
        </Box>
        <Box
          borderStyle={"round"}
          borderColor={"green"}
          width={122}
          flexDirection="column"
        >
          <Text>{text}</Text>
        </Box>
      </Box>
      <Box
        borderStyle={"round"}
        borderColor={"green"}
        width={22}
        flexDirection="column"
      >
        <PaddedText text={`\uf292 ${issue.key}`} />
        <PaddedText
          text={`\uf43a ${issue.fields.storyPoints !== null ? issue.fields.storyPoints : "N/A"}`}
        />
        <PaddedText
          text={`\uf161 ${issue.fields.priority.name}`}
          textProps={{
            color: priorityMap[issue.fields.priority.name] ?? "yellow",
          }}
        />
        <PaddedText text={`\uf007 ${issue.fields.assignee.displayName}`} />
        <PaddedText text={"\uf121 Idk this one yet"} />
        <PaddedText text={`\uf50a ${issue.fields.reporter.displayName}`} />
        {Array.from({ length: 40 - 10 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: We're not actually showing any content, just spaces to override the underlying content
          <PaddedText key={i} text={""} />
        ))}
      </Box>
    </Box>
  );
};
