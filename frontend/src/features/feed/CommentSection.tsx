import { useState, useEffect, useCallback } from 'react'
import { Send, Loader2, Trash2 } from 'lucide-react'
import { postsApi } from '@/api/posts'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { formatDate } from '@/lib/utils'
import type { Comment } from '@/types'

interface CommentSectionProps {
  postId: number
  onCommentCountChange: (count: number) => void
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const user = useAuthStore((s) => s.user)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await postsApi.getComments(postId)
      setComments(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const { data } = await postsApi.addComment(postId, { content: newComment.trim() })
      setComments((prev) => [data, ...prev])
      setNewComment('')
      onCommentCountChange(comments.length + 1)
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      await postsApi.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      onCommentCountChange(comments.length - 1)
    } catch {
      // silent
    }
  }

  return (
    <div className="border-t border-border px-4 py-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-3">
        <UserAvatar
          src={user?.profile_photo_url}
          firstName={user?.first_name}
          lastName={user?.last_name}
          size="sm"
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full rounded-full border border-border bg-bg-primary px-4 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary disabled:text-text-muted transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <UserAvatar
                src={comment.author?.profile_photo_url}
                firstName={comment.author?.first_name}
                lastName={comment.author?.last_name}
                size="sm"
                verificationType={comment.author?.verification_type}
              />
              <div className="flex-1 min-w-0">
                <div className="rounded-xl bg-bg-secondary px-3 py-2">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-text-primary">
                      {comment.author?.first_name} {comment.author?.last_name}
                    </p>
                  </div>
                  <p className="text-sm text-text-primary mt-0.5 break-words">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-[10px] text-text-muted">{formatDate(comment.created_at)}</span>
                  {comment.author_id === user?.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-[10px] text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
