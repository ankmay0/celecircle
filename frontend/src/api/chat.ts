import apiClient from './client'

export interface ChatMessage {
  id: number
  sender_id: number
  receiver_id: number
  gig_id: number | null
  message: string
  is_read: boolean
  attachment_url: string | null
  attachment_type: string | null
  created_at: string
}

export interface Conversation {
  user_id: number
  user_email: string | null
  user_name: string
  user_category: string | null
  user_role: string
  verification_type: string | null
  last_message: string
  last_message_time: string | null
  unread_count: number
  profile_photo_url?: string | null
}

export interface SendMessagePayload {
  receiver_id: number
  message: string
  gig_id?: number
  attachment_url?: string
  attachment_type?: string
}

export interface UploadResult {
  url: string
  type: string
  filename: string
  size: number
}

export const chatApi = {
  listConversations() {
    return apiClient.get<Conversation[]>('/chat/conversations')
  },

  getConversation(userId: number, gigId?: number) {
    return apiClient.get<ChatMessage[]>(`/chat/conversations/${userId}`, {
      params: gigId ? { gig_id: gigId } : undefined,
    })
  },

  sendMessage(data: SendMessagePayload) {
    return apiClient.post<ChatMessage>('/chat', data)
  },

  uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<UploadResult>('/chat/upload', formData, {
      headers: { 'Content-Type': undefined },
    })
  },
}
