import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const defaultErrorQueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      toast(error.message);
    },
  }),
});
