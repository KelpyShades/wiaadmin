import { makeUseQueryWithStatus } from "convex-helpers/react";
import { useQueries } from "convex-helpers/react/cache/hooks";

// This provides us with a richer return value for queries:
// { status: "pending" | "success" | "error", data, error, isPending, isSuccess, isError }
// AND it uses the cached versions from ConvexQueryCacheProvider
export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);
