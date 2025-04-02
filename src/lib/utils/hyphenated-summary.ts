export const hyphenatedSummary = (summary?: string | null) => {
  // please turn camelCase to hyphenated case
  return (
    camelToSnake(summary!)
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "")
      .replace("---", "-") ?? ""
  );
};

const camelToSnake = (string: string): string => {
  let result = "";
  let prevLowercase = false;

  for (const character of string) {
    const isUppercase = character.toUpperCase() === character;
    if (isUppercase && prevLowercase) {
      result += "-";
    }

    result += character;
    prevLowercase = !isUppercase;
  }

  return result.replace(/-+/g, "-").toLowerCase();
};
