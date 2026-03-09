import apiClient from './client'
import type { Post, Comment } from '@/types'

export const postsApi = {
  getFeed(params?: { skip?: number; limit?: number; sort?: string }) {
    return apiClient.get<Post[]>('/posts', { params })
  },

  getPost(postId: number) {
    return apiClient.get<Post>(`/posts/${postId}`)
  },

  createPost(data: { content: string; media_type?: string; files?: File[] }) {
    const formData = new FormData()
    formData.append('content', data.content)
    formData.append('media_type', data.media_type || 'text')
    if (data.files) {
      data.files.forEach((file) => formData.append('files', file))
    }
    return apiClient.post<Post>('/posts', formData, {
      headers: { 'Content-Type': undefined },
    })
  },

  deletePost(postId: number) {
    return apiClient.delete(`/posts/${postId}`)
  },

  likePost(postId: number) {
    return apiClient.post<{ message: string; likes_count: number }>(`/posts/${postId}/like`)
  },

  getLikes(postId: number) {
    return apiClient.get(`/posts/${postId}/likes`)
  },

  getComments(postId: number) {
    return apiClient.get<Comment[]>(`/posts/${postId}/comments`)
  },

  addComment(postId: number, data: { content: string; parent_id?: number }) {
    return apiClient.post<Comment>(`/posts/${postId}/comments`, data)
  },

  deleteComment(commentId: number) {
    return apiClient.delete(`/posts/comments/${commentId}`)
  },
}
