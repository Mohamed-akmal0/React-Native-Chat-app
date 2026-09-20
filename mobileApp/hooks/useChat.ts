import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserChatList,
  getOrCreateUsersChat,
  getAiChatReplies,
} from "../lib/api";
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
    mutationFn: (participantId: string) =>
      getOrCreateUsersChat(apiWithAuth, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useAiChatBot = () => {
  const { apiWithAuth } = useApi();
  return useMutation({
    mutationFn: (aiChatArgs: {
      model: string;
      provider: string;
      history: string[];
      message: string;
    }) => getAiChatReplies(apiWithAuth, aiChatArgs),
    onError: (error) => {
      console.log("🥲 error in use ai chatbot api", error);
    },
  });
};
