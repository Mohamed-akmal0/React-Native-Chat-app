import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../lib/axios";
import { deleteMessage, editMessage, getUserMessages } from "../lib/api";
import { Message } from "../types";

export const useMessages = (chatId: string) => {
  const { apiWithAuth } = useApi();
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getUserMessages(apiWithAuth, chatId),
    enabled: !!chatId,
    // staleTime: 0,
    // refetchOnMount: "always",
    // ! commenting this to remove aggressive refetch, socket always update the cache
  });
};

export const useEditMessage = (chatId: string) => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    // ! mutate fn only accepts once variable object
    mutationFn: (editMessageArgs: {
      messageId: string;
      cipherText: string;
      nonce: string;
    }) => editMessage(apiWithAuth, editMessageArgs),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["messages", chatId],
        (old: Message[] | undefined) =>
          old?.map((m) => (m._id === updated?._id ? { ...m, ...updated } : m)),
      );
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error) => {
      console.log("on error in edit mutate", error);
    },
  });
};

export const useDeleteMessage = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deleteArgs: { messageIds: string[]; typeOfDelete: string }) =>
      deleteMessage(apiWithAuth, deleteArgs),
    onSuccess: (payload) => {
      if (!payload?.chatId || !payload.messageIds?.length) return;
      queryClient.setQueryData<Message[]>(
        ["messages", payload.chatId],
        (old) => old?.filter((m) => !payload.messageIds.includes(m._id)),
      );
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => {
      console.log("on error in delete mutate", error);
    },
  });
};
