import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { request } from "./request.js";
import { env } from "../env.js";

const boardSchema = z.object({
  columnConfig: z.object({
    columns: z.array(
      z.object({
        name: z.string(),
      }),
    ),
  }),
});

const fetchBoard = async () => {
  const response = await request(`agile/1.0/board/${env.JIRA_BOARD_ID}/configuration`);
  return boardSchema.parse(response).columnConfig.columns;
};

export const useBoardQuery = () => {
  return useQuery({
    queryKey: ["board"],
    queryFn: fetchBoard,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
};
