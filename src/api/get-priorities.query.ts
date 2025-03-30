import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { HOUR, request } from "./request.js";

const priority = z.object({
  statusColor: z.string(),
  description: z.string(),
  name: z.string(),
  id: z.string(),
});

const fetchPriorities = async (projectId: string) => {
  const response = await request(
    `api/3/priority/search?projectId=${projectId}`,
  );

  return z.object({ values: z.array(priority) }).parse(response).values;
};

export const useGetPrioritiesQuery = (projectId: string, enabled = true) => {
  return useQuery({
    queryKey: ["priorities"],
    queryFn: () => fetchPriorities(projectId),
    staleTime: HOUR,
    enabled,
  });
};

export const prefetchPriorities = async (projectId: string) => {
  const queryClient = useQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["priorities"],
    queryFn: () => fetchPriorities(projectId),
    staleTime: HOUR,
  });
};
