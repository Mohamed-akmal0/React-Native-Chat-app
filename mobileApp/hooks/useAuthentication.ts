import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserProfile, loginApi } from "../lib/api";
import { useApi } from "../lib/axios";
import * as Sentry from "@sentry/react-native";

export const useAuthLogin = () => {
  const {apiWithAuth} = useApi();
  return useMutation({
    mutationFn: () => loginApi(apiWithAuth),
    onSuccess: (data) => {
      console.log("😀 data in login api", data);
      Sentry.logger.info("user profile details", {
        userData: data,
      });
    },
    onError: (error) => {
      console.log("🥲 error in login api", error);
    },
  });
};

export const useUserProfile = () => {
  const { apiWithAuth } = useApi();
  return useQuery({
    queryKey: ["userprofile"],
    queryFn: () => getUserProfile(apiWithAuth),
    refetchOnMount: false,
  });
};
