import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { authUrls, chats, users } from "./urls";
import { Chat, User } from "../types";

type ApiWithAuth = <T = unknown>(
  config: AxiosRequestConfig,
) => Promise<AxiosResponse<T>>;

const unwrapUser = (data: User | { user: User }) =>
  data && "user" in data && data.user ? data.user : (data as User);

export const loginApi = async (apiWithAuth: ApiWithAuth, publicKey: string) => {
  try {
    const { data } = await apiWithAuth({
      method: "POST",
      url: authUrls.login,
      data: {publicKey}
    });
    return data;
  } catch (error) {
    console.log("error in login api", error);
    throw error;
  }
};

export const getUserProfile = async (apiWithAuth: ApiWithAuth) => {
  try {
    const { data } = await apiWithAuth<User | { user: User }>({
      method: "GET",
      url: authUrls.profile,
    });
    return unwrapUser(data);
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
    console.log('return data', data)
    return data;
  } catch (error) {
    console.log("err in get users api", error);
    throw error;
  }
};

export const getCurrentUserDetails = async (apiWithAuth: ApiWithAuth) => {
  try {
    const { data } = await apiWithAuth<User | { user: User }>({
      method: "GET",
      url: users.currentUser,
    });
    return unwrapUser(data);
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

export const editMessage = async (
  apiWithAuth: ApiWithAuth,
  editMessageArgs :{messageId:string, cipherText:string, nonce:string},
) => {
  try {
    const {messageId, cipherText, nonce} = editMessageArgs
    const { data } = await apiWithAuth({
      method: "PATCH",
      url: chats.editMessage(messageId),
      data: {
        cipherText,
        nonce,
      },
    });
    return data;
  } catch (error) {
    console.log("err in get message api", error);
    throw error;
  }
};
