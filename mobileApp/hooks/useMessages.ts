import { useQuery } from "@tanstack/react-query";
import { useApi } from "../lib/axios";
import { getUserMessages } from "../lib/api";

export const useMessages = (chatId: string) => {
  const { apiWithAuth } = useApi();
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getUserMessages(apiWithAuth, chatId),
    enabled: !!chatId,
  });
};
