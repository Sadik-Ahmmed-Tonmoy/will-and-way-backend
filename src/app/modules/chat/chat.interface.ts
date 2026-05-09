export interface ICreateConversation {
  participantIds: string[]; // exactly two user IDs
}

export interface ISendMessage {
  conversationId: string;
  content: string;
  imageUrl?: string;
}

export interface IMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    profileImage: string;
  };
}