import { useQuery } from "@tanstack/react-query";
import { getUserChatList } from "../lib/api";
import { useApi } from "../lib/axios";

export const useGetUserChatList = () => {
  const { apiWithAuth } = useApi();
  return useQuery({
    queryKey: ["getChats"],
    queryFn: () => getUserChatList(apiWithAuth),
  });
};
