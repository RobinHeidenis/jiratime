import { Box, Text, useInput } from "ink";
import React, { useState } from "react";
import { useIssueQuery } from "./api/issue-query.js";
import { useBoardQuery } from "./api/board-query.js";
import { Column } from "./column.js";
import { useStdoutDimensions } from "./useStdoutDimensions.js";

export const BoardView = () => {
  const { data: columnData } = useBoardQuery();
  const { data: issues } = useIssueQuery(true);
  const [width, height] = useStdoutDimensions();
  const [columnOffset, setColumnOffset] = useState(0);
  const [top, setTop] = useState(0);

  const maxIssueCount = issues
    ? Math.max(
        ...Object.values(issues).map((issues) => (issues ? issues.length : 0)),
      )
    : 0;
  const totalHeight = Math.max(maxIssueCount * 7 - height, 0);
  const maxColumnOffset = Math.floor(
    (columnData?.length ?? 0) - width / 36 + 1,
  );
  const allColumnsVisible = (columnData?.length ?? 0) <= width / 36;

  useInput((input, key) => {
    if (input === "j" || key.downArrow) {
      setTop(Math.min(totalHeight === 0 ? 0 : totalHeight + 10, top + 10));
    } else if (input === "k" || key.upArrow) {
      setTop(Math.max(0, top - 10));
    } else if (input === "h" || key.leftArrow) {
      setColumnOffset(Math.floor(Math.max(0, columnOffset - 1)));
    } else if (input === "l" || key.rightArrow) {
      setColumnOffset(Math.floor(Math.min(maxColumnOffset, columnOffset + 1)));
    }
  });

  const columns = columnData?.map((column) => column.name);

  if (!columns || !issues) {
    return (
      <Box width={"100%"}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={width - 2}>
      <Box width={"100%"} overflow="hidden">
        <Box gap={1} width={"100%"}>
          {columns?.slice(columnOffset).map((name, index) => (
            <Column
              name={name}
              key={name}
              issues={issues ? (issues[name.toLowerCase()] ?? []) : []}
              top={top}
              hideIssues={(index + 1) * 36 > width}
            />
          ))}
        </Box>
        <Box
          height={"50%"}
          borderLeft={false}
          borderBottom={false}
          borderTop={false}
          borderColor={"greenBright"}
          borderStyle={"bold"}
          marginTop={totalHeight === 0 ? 0 : ((height / totalHeight) * top) / 2 - 3}
        />
      </Box>
      <Box
        width={allColumnsVisible ? "100%" : "50%"}
        borderStyle={"bold"}
        borderBottom={false}
        borderColor={"greenBright"}
        borderRight={false}
        borderLeft={false}
        marginLeft={Math.min((width / 2 / maxColumnOffset) * columnOffset, width / 2 - 2)}
      />
    </Box>
  );
};
