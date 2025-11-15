
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewMessage {
  senderId: string;
  receiverId: string;
  content: string;
}
