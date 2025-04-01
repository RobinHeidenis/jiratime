import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { makeLogger } from "../lib/logger.js";
import type { ApiRequester } from "./request.js";

const logger = makeLogger("GetCustomFields");

const field = z.object({
  id: z.string(),
  name: z.string(),
  custom: z.boolean(),
});

export type JiraField = z.infer<typeof field>;

const fetchCustomFields = async (request: ApiRequester) => {
  const response = await request("api/3/field");

  try {
    return z
      .array(field)
      .parse(response)
      .filter((f) => f.custom);
  } catch (error) {
    logger.error("Failed to parse response", error);
    throw error;
  }
};

export const useCustomFieldsQuery = (request: ApiRequester) => {
  return useQuery({
    queryKey: ["customFields"],
    queryFn: () => fetchCustomFields(request),
    refetchOnReconnect: false,
    refetchInterval: false,
  });
};
