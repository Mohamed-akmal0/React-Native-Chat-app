import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../lib/api";
import { useApi } from "../lib/axios";

export const useUsers = () => {
  const { apiWithAuth } = useApi();
  return useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(apiWithAuth),
  });
};
