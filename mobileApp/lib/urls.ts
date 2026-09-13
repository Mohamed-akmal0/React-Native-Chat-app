export const authUrls = {
  login: "/auth/callback",
  profile: "/auth/me",
};

export const chats = {
  chats: "/chats",
  getOrCreateChats: (participantId: string) => `/chats/with/${participantId}`,
  getMessages: (chatId: string) => `/messages/messages/${chatId}`,
  editMessage: (messageId: string) => `/messages/messages/${messageId}/edit`,
  deleteMessage:  `/messages/messages/delete`
};

export const users = {
  users: "/users",
  currentUser: "/auth/me"
};
