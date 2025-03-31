import { Select, TextInput } from "@inkjs/ui";
import { Box, Text, useInput } from "ink";
import { useState } from "react";

export const SelectWithSearch = ({
  options,
  onSelect,
  skippable = true,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  onSelect: (value: string | null) => void;
  skippable?: boolean;
}) => {
  const [search, setSearch] = useState("");

  const optionsBySearch = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  useInput((_input, key) => {
    if (key.escape && skippable) {
      onSelect(null);
    }
  });

  return (
    <Box flexDirection="column" paddingLeft={2} gap={1}>
      <Box flexDirection="column" gap={1}>
        <Text color="gray">Search for options</Text>
        <TextInput onChange={setSearch} />
      </Box>

      <Box flexDirection="column" gap={1}>
        <Text>{"Select an option"}</Text>
        <Select
          options={optionsBySearch}
          onChange={(value) => {
            onSelect(value);
          }}
        />
      </Box>

      {skippable && <Text color="blueBright">{"Press <esc> to skip"}</Text>}
    </Box>
  );
};
