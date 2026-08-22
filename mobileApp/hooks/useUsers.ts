import { useQuery } from "@tanstack/react-query";
import { useApi } from "../lib/axios";
import { getAllUsers, getCurrentUserDetails } from "../lib/api";

export const useUsers = () => {
  const { apiWithAuth } = useApi();
  return useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(apiWithAuth),
  });
};

export const useCurrentUser = () => {
  const { apiWithAuth } = useApi();
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => getCurrentUserDetails(apiWithAuth),
  });
}
