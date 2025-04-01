import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { log } from "../lib/log.js";
import type { ApiRequester } from "./request.js";

const zStringOrNumber = z
  .string()
  .or(z.number())
  .transform((v) => String(v));

const board = z
  .object({
    id: zStringOrNumber,
    name: z.string(),
    type: z.string(),
    location: z
      .object({
        projectId: zStringOrNumber,
        projectName: z.string(),
      })
      .optional(),
  })
  .transform((v) => {
    return {
      ...v,
      displayName: v.location?.projectName
        ? `${v.location.projectName ?? ""} - ${v.name}`
        : v.name,
    };
  });

const boardSchema = z.object({
  values: z.array(board),
});

const fetchBoards = async (request: ApiRequester) => {
  const allItems: Array<z.infer<typeof board>> = [];

  const response = await request("/agile/1.0/board");

  try {
    const parsed = boardSchema.parse(response);
    allItems.push(...parsed.values);
  } catch (error) {
    log(`Failed to parse response for boards: ${error}`);
    throw error;
  }

  return allItems;
};

export const useBoardsQuery = (request: ApiRequester) => {
  return useQuery({
    queryKey: ["boards"],
    queryFn: () => fetchBoards(request),
    refetchOnReconnect: false,
    refetchInterval: false,
  });
};
