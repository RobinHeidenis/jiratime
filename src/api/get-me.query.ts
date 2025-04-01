import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { makeLogger } from "../lib/logger.js";
import type { ApiRequester } from "./request.js";

const logger = makeLogger("GetMe");

const profile = z.object({
  accountId: z.string(),
  displayName: z.string(),
});

export type JiraProfile = z.infer<typeof profile>;

const fetchMe = async (request: ApiRequester) => {
  const response = await request("api/3/myself");

  try {
    return profile.parse(response);
  } catch (error) {
    logger.error("Failed to parse response", error);
    throw error;
  }
};

export const useMeQuery = (request: ApiRequester) => {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe(request),
    refetchOnReconnect: false,
    refetchInterval: false,
  });
};
