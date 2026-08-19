import { useApi } from "./axios";
import { authUrls } from "./urls";

export const loginApi = async (api: any) => {
  try {
    const { data } = await api.post(authUrls.login);
    return data;
  } catch (error) {
    console.log("error in login api", error);
    throw error;
  }
};
