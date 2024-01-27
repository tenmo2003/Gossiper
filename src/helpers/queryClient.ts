import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const getDefaultErrorQueryClient = (action: any) =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error: Error) => {
        toast(error.message);
        action();
      },
    }),
  });
