import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { HOUR, request } from "./request.js";

const user = z.object({
  accountId: z.string(),
  displayName: z.string(),
});

const fetchUsers = async (issueId: string | number) => {
  const response = await request(
    `api/3/user/assignable/search?issueId=${issueId}`,
  );

  return z.array(user).parse(response);
};

export const useGetUsersQuery = (issueId: string | number) => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(issueId),
    gcTime: HOUR,
    staleTime: HOUR,
  });
};
