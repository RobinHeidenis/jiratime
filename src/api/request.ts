import { env } from "../env.js";
import { makeLogger } from "../lib/logger.js";
import { tryParseJson } from "../lib/utils/try-parse-json.js";

export const HOUR = 1000 * 60 * 60;

export type ApiRequester = ReturnType<typeof makeRequester>;

const logger = makeLogger("Request");

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

      const normalizedPath = endpoint.startsWith("/")
        ? endpoint.slice(1)
        : endpoint;

      const url = new URL(`/rest/${normalizedPath}`, jiraUrl);

      logger.debug("Sending request", { endpoint: url.toString(), options });

      const response = await fetch(url, options);

      const responseText = await response.text();

      logger.debug("Received response", {
        status: response.status,
        endpoint: url.toString(),
      });

      if (!response.ok) {
        logger.error(`Fetching ${endpoint} returned ${response.status}`, {
          response: tryParseJson(responseText) ?? responseText,
        });

        throw new Error(`Error fetching ${endpoint}: ${responseText}`);
      }

      if (responseText === "") {
        return {};
      }

      return JSON.parse(responseText);
    }
  };
};

const noopRequester: ApiRequester = async () => {
  logger.debug("No requester available");
  throw new Error("No requester available");
};

export const request = env.onboarded
  ? makeRequester(new URL(env.JIRA_BASE_URL), env.JIRA_API_KEY)
  : noopRequester;
