export interface User {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    publicKey?: string;
  }
  
  export interface MessageSender {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    publicKey?: string;
  }
  
  export interface Message {
    _id: string;
    chatId: string;
    senderId: MessageSender | string;
    text?: string;
    cipherText: string | any;
    nonce: string | any;
    createdAt: string;
    updatedAt: string;
    isEditted: boolean;
    isSoftDelete?: boolean;
    isHardDelete?: boolean;
  }
  
  export interface ChatLastMessage {
    _id: string;
    cipherText: string;
    nonce: string;
    senderId: string;
    createdAt: string;
    isSoftDelete?: boolean;
    isHardDelete?: boolean;
  }
  
  export interface Chat {
    _id: string;
    otherParticipant: MessageSender;
    lastMessage: ChatLastMessage | null;
    lastMessageAt: string;
    createdAt: string;
  }