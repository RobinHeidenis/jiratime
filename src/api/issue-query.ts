import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { env } from "../env.js";
import { request } from "./request.js";

// Helper type to make TypeScript happy with dynamic field access
type DynamicFields = {
  [key: string]: unknown;
};

export const issue = z
  .object({
    id: z.string(),
    self: z.string(),
    key: z.string(),
    fields: z
      .object({
        summary: z.string(),
        sprint: z.object({
          name: z.string(),
        }),
        description: z.string().nullable(),
        reporter: z.object({
          displayName: z.string(),
        }),
        assignee: z.object({
          displayName: z.string(),
        }),
        priority: z.object({
          name: z.string(),
        }),
        status: z.object({
          name: z.string(),
          statusCategory: z.object({
            name: z.string(),
          }),
        }),
      })
      .and(
        z.record(z.string(), z.unknown()), // Allow any additional fields
      ),
  })
  .transform((data) => {
    // Get the story points value from the dynamic field
    const storyPoints = (data.fields as DynamicFields)[env.STORY_POINTS_FIELD];
    let developer: string | null = null;
    if (env.DEVELOPER_FIELD) {
      developer = ((data.fields as DynamicFields)[env.DEVELOPER_FIELD] as {displayName: string}).displayName;
    }

    // Return a new object with all the original data plus the transformed storyPoints field
    return {
      ...data,
      fields: {
        ...data.fields,
        storyPoints: storyPoints != null ? Number(storyPoints) : null,
        developer,
      },
    };
  });

const issueSchema = z.object({
  issues: z.array(issue),
});

const fetchIssues = async () => {
  const fields = [
    "id",
    "key",
    "priority",
    "assignee",
    "status",
    "reporter",
    "issuetype",
    "sprint",
    "description",
    "summary",
    env.STORY_POINTS_FIELD,
    env.DEVELOPER_FIELD,
  ].filter(Boolean);

  const response = await request(
    `agile/1.0/board/${env.JIRA_BOARD_ID}/issue?fields=${fields.join(",")}&jql=status NOT IN ('Need more info') AND sprint in openSprints() ORDER BY Rank ASC&maxResults=200`,
  );
  const issues = issueSchema.parse(response).issues;

  return issues;
};

export const useIssueQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: ["issues"],
    queryFn: fetchIssues,
    enabled,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
};
