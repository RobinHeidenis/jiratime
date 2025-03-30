import { Text, useInput } from "ink";

const CURSOR = "█";

type SearchProps = {
  supportsNewLines?: boolean;
  value: string;
  onChange: (value: string) => void;
  onStopSearching: () => void;
};

export const SearchInput = ({
  state,
  onResetSearch,
  onConfirmSearch,
  ...searchProps
}: {
  state: "search" | "result";
  onResetSearch: () => void;
  onConfirmSearch: () => void;
} & SearchProps) => {
  useInput((_, key) => {
    if (key.escape && state === "result") {
      onResetSearch();
      return;
    }

    if (key.return && state === "search") {
      onConfirmSearch();
    }
  });

  if (state === "result") {
    return (
      <Text>
        Search: matches for '{searchProps.value}'{" "}
        <Text color="blue">{"<Esc>: Exit search"}</Text>{" "}
      </Text>
    );
  }

  return <Search {...searchProps} />;
};

export const Search = ({
  supportsNewLines = false,
  value,
  onChange,
  onStopSearching,
}: SearchProps) => {
  const handleChange = (value: string) => {
    onChange(value);
  };

  useInput((input, key) => {
    if (key.escape) {
      return onStopSearching();
    }

    // Don't add new lines
    if (key.return && !supportsNewLines) {
      return;
    }

    // Hitting backspace counts as delete?
    if (key.delete || key.backspace) {
      handleChange(value.slice(0, -1));
    } else {
      handleChange(value + input);
    }
  });

  const searchDisplay = `Search: ${value}${CURSOR}`;

  return <Text>{searchDisplay}</Text>;
};
