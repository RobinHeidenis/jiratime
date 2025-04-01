import { env } from "../env.js";
import { log } from "../lib/log.js";

export const HOUR = 1000 * 60 * 60;

export type ApiRequester = ReturnType<typeof makeRequester>;

export const makeRequester = (jiraUrl: URL, apiToken: string) => {
  return async (endpoint: string, customOptions?: RequestInit) => {
    {
      const options: RequestInit = {
        method: "GET",
        headers: {
          Authorization: `Basic ${apiToken}`,
          "Content-Type": "application/json",
        },
        ...customOptions,
      };

      const response = await fetch(
        new URL(`/rest/${endpoint}`, jiraUrl),
        options,
      );

      const responseText = await response.text();
      log(`Response from ${endpoint}: ${response.status}`);

      if (!response.ok) {
        log(
          `Fetching ${endpoint} returned ${response.status}; response: ${responseText}`,
        );
        throw new Error(`Error fetching ${endpoint}: ${await response.text()}`);
      }

      if (responseText === "") {
        return {};
      }

      return JSON.parse(responseText);
    }
  };
};

const noopRequester: ApiRequester = async () => {
  throw new Error("No requester available");
};

export const request = env.onboarded
  ? makeRequester(new URL(env.JIRA_BASE_URL), env.JIRA_API_KEY)
  : noopRequester;
