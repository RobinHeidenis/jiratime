import { makeRequester } from "../api/request.js";

export const useRequester = (jiraUrl: URL | null, apiToken: string) => {
  if (!jiraUrl) {
    return null;
  }

  return makeRequester(jiraUrl, apiToken);
};
