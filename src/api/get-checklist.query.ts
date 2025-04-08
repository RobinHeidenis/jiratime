import { useQuery } from "@tanstack/react-query";
import { decode } from "html-entities";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { request } from "./request.js";

const checklistQueryResponse = z.object({
  data: z.object({
    viewIssue: z.object({
      ecosystem: z.object({
        contextPanels: z.array(
          z.object({
            name: z.string(),
            iframe: z.object({
              options: z.string(),
            }),
          }),
        ),
      }),
    }),
  }),
});

const iframeOptions = z.object({
  url: z.string(),
});

const checklistSchema = z.array(
  z.object({
    id: z.string(),
    summary: z.string(),
    fixed: z.boolean(),
    order: z.number(),
    description: z.string().nullable(),
  }),
);

const fetchIssueChecklist = async (issueId: string) => {
  try {
    const response = await request("/gira/1", {
      method: "POST",
      body: JSON.stringify({
        query: `query getIssueChecklist {
        viewIssue(issueId: "${issueId}") {
          ecosystem {
            contextPanels {
              name
              iframe {
                options
              }
            }
          }
        }
      }`,
      }),
    });

    const options = checklistQueryResponse
      .parse(response)
      .data.viewIssue.ecosystem.contextPanels.find(
        (panel) => panel.name === "Checklist",
      )?.iframe.options;

    if (!options) {
      logger.error("No checklist found in data", { issueId, response });
      return [];
    }

    const parsedOptions = iframeOptions.parse(JSON.parse(options));

    const checklistUrl = parsedOptions.url;

    const checklistResponse = await fetch(checklistUrl);
    if (!checklistResponse.ok) {
      logger.error("Failed to fetch checklist", { checklistUrl, response });
      return [];
    }

    const checklistPage = await checklistResponse.text();

    const metaTag = checklistPage.match(
      /<meta name="prefetchedItems" content="([^"]+)">/,
    );

    const checklist = metaTag?.[1];
    if (!checklist) {
      logger.error("No checklist found in meta tag", {
        checklistUrl,
        response,
      });
      return [];
    }

    const decodedChecklist = decode(checklist);

    const parsedChecklist = checklistSchema.parse(JSON.parse(decodedChecklist));

    return parsedChecklist;
  } catch (error) {
    logger.error("Failed to fetch issue checklist", {
      issueId,
      error,
      message:
        error && typeof error === "object" && "message" in error
          ? error?.message
          : undefined,
    });
    return [];
  }
};

export const useGetIssueChecklistQuery = (issueId: string, enabled = true) => {
  return useQuery({
    queryKey: ["checklist", issueId],
    queryFn: () => fetchIssueChecklist(issueId),
    staleTime: 1000 * 60 * 15,
    enabled,
  });
};
