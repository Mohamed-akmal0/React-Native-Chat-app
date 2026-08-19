import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../lib/api";
import { useApi } from "../lib/axios";

export const useAuthLogin = () => {
    const api = useApi()
  return useMutation({
    mutationFn: () =>  loginApi(api),
    onSuccess: (data) => {
      console.log("😀 data in login api", data);
    },
    onError: (error) => {
      console.log("🥲 error in login api", error);
    },
  });
};
