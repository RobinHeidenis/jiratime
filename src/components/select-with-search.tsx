import { Select, TextInput } from "@inkjs/ui";
import { Box, Text } from "ink";
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

  const optionsBySearch = options.filter(
    (option) =>
      !search || option.label.toLowerCase().includes(search.toLowerCase()),
  );

  if (skippable) {
    optionsBySearch.unshift({ value: "<skip>", label: "<skip>" });
  }

  return (
    <Box flexDirection="column" paddingLeft={2} gap={1}>
      <Box flexDirection="column" gap={1}>
        <Text color="gray">Search for options</Text>
        <TextInput onChange={setSearch} />
      </Box>

      <Select
        options={optionsBySearch}
        visibleOptionCount={20}
        onChange={(value) => {
          onSelect(value === "<skip>" ? null : value);
        }}
      />
    </Box>
  );
};
