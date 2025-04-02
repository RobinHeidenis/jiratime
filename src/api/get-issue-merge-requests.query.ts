import { type QueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { HOUR, request } from "./request.js";

const mergeRequest = z.object({
  author: z.object({
    name: z.string(),
  }),
  name: z.string(),
  repositoryName: z.string(),
  status: z.enum(["OPEN", "MERGED", "DECLINED"]),
  url: z.string(),
  reviewers: z.array(
    z.object({
      approved: z.boolean(),
    }),
  ),
});

const fetchIssueMergeRequests = async (issueId: string) => {
  const response = await request(
    `dev-status/1.0/issue/details?issueId=${issueId}`,
  );

  if (!response?.detail?.length || !response?.detail[0]?.pullRequests) {
    return [];
  }

  return z.array(mergeRequest).parse(response.detail[0].pullRequests);
};

export const useGetIssueMergeRequestsQuery = (
  issueId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["mergeRequests", issueId],
    queryFn: () => fetchIssueMergeRequests(issueId),
    staleTime: HOUR,
    enabled,
  });
};

export const prefetchIssueMergeRequests = async (
  queryClient: QueryClient,
  issueId: string,
) => {
  await queryClient.prefetchQuery({
    queryKey: ["mergeRequests", issueId],
    queryFn: () => fetchIssueMergeRequests(issueId),
    staleTime: HOUR,
  });
};
