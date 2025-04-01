import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import type { JiraField } from "../../api/get-custom-fields.query.js";
import { SelectWithSearch } from "../../components/select-with-search.js";

const useActiveField = (
  fields: ReadonlyArray<{ value: string; label: string }>,
) => {
  const [fieldIndex, setFieldIndex] = useState(0);

  const activeField = fields[fieldIndex];

  const nextField = () => {
    setFieldIndex((prev) => prev + 1);
  };

  return { activeField, nextField };
};

export const SelectCustomField = ({
  customFields,
  onSelect,
  fieldsToConfigure,
}: {
  fieldsToConfigure: ReadonlyArray<{ value: string; label: string }>;
  customFields: readonly JiraField[];
  onSelect: (fields: Record<string, string | null>) => void;
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string | null>>({});

  const { activeField, nextField } = useActiveField(fieldsToConfigure);

  useEffect(() => {
    if (!activeField) {
      onSelect(result);
    }
  }, [onSelect, activeField, result]);

  if (!activeField) {
    return null;
  }

  return (
    <Box flexDirection="column" height={20} gap={1}>
      <Text>What custom field should be used for "{activeField.label}"?</Text>

      <SelectWithSearch
        key={activeField.value}
        skippable
        options={customFields.map((field) => ({
          value: field.id,
          label: field.name,
        }))}
        onSelect={(fieldId) => {
          const field = customFields.find((f) => f.id === fieldId);

          if (!field) {
            setErrorMessage("Select a field or skip");
            return;
          }

          setResult({ ...result, [activeField.value]: field.id });
          nextField();
        }}
      />

      {errorMessage && <Text color="red">{errorMessage}</Text>}
    </Box>
  );
};
