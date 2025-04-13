
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewMessage {
  senderId: string;
  receiverId: string;
  content: string;
}
