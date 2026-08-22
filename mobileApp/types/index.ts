export interface User {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  }
  
  export interface MessageSender {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  }
  
  export interface Message {
    _id: string;
    chat: string;
    senderId: MessageSender | string;
    text: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ChatLastMessage {
    _id: string;
    text: string;
    sender: string;
    createdAt: string;
  }
  
  export interface Chat {
    _id: string;
    otherParticipant: MessageSender;
    lastMessage: ChatLastMessage | null;
    lastMessageAt: string;
    createdAt: string;
  }