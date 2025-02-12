import { env } from "../env.js";

export const request = async (endpoint: string) => {
  const options = {
    method: "GET",
    headers: {
      Authorization:
        `Basic ${env.JIRA_API_KEY}`,
    },
  };

  const response = await fetch(
    `${env.JIRA_BASE_URL}/rest/${endpoint}`,
    options,
  );
  return await response.json();
};
