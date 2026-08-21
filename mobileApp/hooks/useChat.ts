import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getUserChatList, getOrCreateUsersChat } from "../lib/api";
import { useApi } from "../lib/axios";

export const useGetUserChatList = () => {
  const { apiWithAuth } = useApi();
  return useQuery({
    queryKey: ["chats"],
    queryFn: () => getUserChatList(apiWithAuth),
  });
};

export const useGetOrCreateChat = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => getOrCreateUsersChat(apiWithAuth, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
