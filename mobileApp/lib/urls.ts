export const authUrls = {
  login: "/auth/callback",
  profile: "/auth/me",
};

export const chats = {
  chats: "/chats",
  getOrCreateChats: (participantId: string) => `/chats/with/${participantId}`,
};

export const users = {
  users: "/users",
};
