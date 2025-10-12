import { makeRequester } from "../api/request.ts";

export const useRequester = (jiraUrl: string | null, apiToken: string) => {
  if (!jiraUrl) {
    return null;
  }

  return makeRequester(new URL(jiraUrl), apiToken);
};
