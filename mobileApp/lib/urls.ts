export const authUrls = {
  login: "/auth/callback",
  profile: "/auth/me",
};

export const chats = {
  chats: "/chats",
  getOrCreateChats: (participantId: string) => `/chats/with/${participantId}`,
  getMessages: (chatId: string) => `/messages/messages/${chatId}`
};

export const users = {
  users: "/users",
  currentUser: "/auth/me"
};
