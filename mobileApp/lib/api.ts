import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { authUrls, chats } from "./urls";
import { Chat } from "../types";

type ApiWithAuth = <T = unknown>(
  config: AxiosRequestConfig,
) => Promise<AxiosResponse<T>>;

export const loginApi = async (apiWithAuth: ApiWithAuth) => {
  try {
    const { data } = await apiWithAuth({
      method: "POST",
      url: authUrls.login,
    });
    return data;
  } catch (error) {
    console.log("error in login api", error);
    throw error;
  }
};

export const getUserProfile = async (apiWithAuth: ApiWithAuth) => {
  try {
    const { data } = await apiWithAuth({
      method: "GET",
      url: authUrls.profile,
    });
    return data;
  } catch (error) {
    console.log("err in user profile api", error);
    throw error;
  }
};

export const getUserChatList = async (apiWithAuth: ApiWithAuth) => {
  try {
    const { data } = await apiWithAuth<Chat[]>({ method: "GET", url: chats.chats });
    return data;
  } catch (error) {
    console.log("err in get chat api", error);
    throw error;
  }
};
