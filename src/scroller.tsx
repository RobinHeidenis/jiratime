import { Box, Text, measureElement, useInput } from "ink";
// biome-ignore lint/style/useImportType: <explanation>
import React, { useEffect, useRef, useState } from "react";

export type UpCommand = { type: "up" };
export type DownCommand = { type: "down" };
export type LeftCommand = { type: "left" };
export type RightCommand = { type: "right" };

export type Command = UpCommand | DownCommand | LeftCommand | RightCommand;

export type Layout = {
  height: number;
  width: number;
};

export type Position = {
  top: number;
  left: number;
};

export interface HasOnLayout {
  onLayout(options: {
    height: number;
    width: number;
    layout: any;
  }): void;
}
export interface Props {
  height: number;
  width: number;
  children: React.ReactNode;
}

export const Scroller: React.FC<Props> = ({ height, width, children }) => {
  const ref = useRef();

  const [layout, setLayout] = useState<{
    height: number;
    width: number;
  }>({
    height: 0,
    width: 0,
  });

  useEffect(() => {
    // @ts-ignore
    setLayout(measureElement(ref.current));
  }, []);

  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);

  useInput((input, key) => {
    if (input === "j" || key.downArrow) {
      setTop(Math.min(layout.height, top + 10));
    } else if (input === "k" || key.upArrow) {
      setTop(Math.max(0, top - 10));
    } else if (input === "h" || key.leftArrow) {
      setLeft(Math.max(0, left - 10));
    } else if (input === "l" || key.rightArrow) {
      setLeft(Math.min(layout.width, left + 10));
    }
  });

  return (
    <Box height={height} width={width} flexDirection="column">
      <Box
        height={layout.height - 2}
        width={layout.width - 2}
        flexDirection="column"
        overflow="hidden"
      >
        <Box
          // @ts-expect-error
          ref={ref}
          flexShrink={0}
          flexDirection="column"
          marginTop={-top}
          marginLeft={-left}
          width={layout.width - 2}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
