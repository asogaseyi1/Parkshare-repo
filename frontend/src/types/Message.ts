export interface Conversation {
  id: string;
  parkingSpaceId: string;
  parkingSpaceTitle: string;
  hostEmail: string;
  guestEmail: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface ConversationRequest {
  parkingSpaceId: string;
  initialMessage?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderEmail: string;
  body: string;
  sentAt: string;
}
