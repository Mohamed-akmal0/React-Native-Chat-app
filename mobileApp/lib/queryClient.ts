import { QueryClient } from "@tanstack/react-query";

//The QueryClient is the core engine. It holds the entire cache, manages background refetching,
// and controls global behaviour. You create it once and it lives for the entire app lifetime.

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000 * 5, //data is fresh for 5 minutes globally
      gcTime: 60 * 1000 * 10, //keep unused data for 10 minutes globally
      retry: 2, //retry 2 times globally
      refetchOnWindowFocus: false, //do not refetch when apps comes to foreground
      refetchOnMount: true, // refetch when component mounts if stale
      refetchInterval: false, //do not refetch on interval globally
      refetchOnReconnect: true, // refetch when internet reconnects
    },
    mutations: {
      retry: 0, // never retry mutations (login, order etc)
    },
  },
});
