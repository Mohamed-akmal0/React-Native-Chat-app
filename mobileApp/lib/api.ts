import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { authUrls, chats, users } from "./urls";
import { Chat, User } from "../types";

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
    const { data } = await apiWithAuth<Chat[]>({
      method: "GET",
      url: chats.chats,
    });
    return data;
  } catch (error) {
    console.log("err in get chat api", error);
    throw error;
  }
};

export const getOrCreateUsersChat = async <Promise>(
  apiWithAuth: ApiWithAuth,
  participantId: string,
) => {
  try {
    const { data } = await apiWithAuth<Chat>({
      method: "POST",
      url: chats.getOrCreateChats(participantId),
    });
    return data;
  } catch (error) {
    console.log("err in get or create chat api", error);
    throw error;
  }
};

export const getAllUsers = async (apiWithAuth: ApiWithAuth) => {
  try {
    const { data } = await apiWithAuth<User[]>({
      method: "GET",
      url: users.users,
    });
    return data;
  } catch (error) {
    console.log("err in get users api", error);
    throw error;
  }
};

export const getCurrentUserDetails = async (apiWithAuth: ApiWithAuth) => {
  try {
    const { data } = await apiWithAuth<User>({
      method: "GET",
      url: users.currentUser,
    });
    return data;
  } catch (error) {
    console.log("err in get current user api", error);
    throw error;
  }
};

export const getUserMessages = async (
  apiWithAuth: ApiWithAuth,
  chatId: string,
) => {
  try {
    const { data } = await apiWithAuth({
      method: "GET",
      url: chats.getMessages(chatId),
    });
    return data;
  } catch (error) {
    console.log("err in get message api", error);
    throw error;
  }
};
