export const tryParseJson = (json: string) => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};
