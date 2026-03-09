import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Heart,
  PartyPopper,
  Lightbulb,
  Bookmark,
} from 'lucide-react'
import { postsApi } from '@/api/posts'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { VerificationBadge } from '@/components/shared/VerificationBadge'
import { formatDate, cn } from '@/lib/utils'
import { CommentSection } from './CommentSection'
import type { Post } from '@/types'

interface PostCardProps {
  post: Post
  onDeleted?: () => void
  style?: React.CSSProperties
}

const MAX_CONTENT_LENGTH = 280
const reactions = [
  { icon: ThumbsUp, label: 'Like', color: 'text-primary' },
  { icon: Heart, label: 'Love', color: 'text-rose-500' },
  { icon: PartyPopper, label: 'Celebrate', color: 'text-amber-500' },
  { icon: Lightbulb, label: 'Insightful', color: 'text-yellow-500' },
]

export function PostCard({ post, onDeleted, style }: PostCardProps) {
  const user = useAuthStore((s) => s.user)
  const [liked, setLiked] = useState(post.is_liked ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [commentsCount, setCommentsCount] = useState(post.comments_count)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [saved, setSaved] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const reactionTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const author = post.author
  const isLong = post.content.length > MAX_CONTENT_LENGTH
  const displayContent = isLong && !expanded
    ? post.content.slice(0, MAX_CONTENT_LENGTH) + '...'
    : post.content

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLike = async () => {
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 300)
    try {
      const { data } = await postsApi.likePost(post.id)
      setLiked(!liked)
      setLikesCount(data.likes_count)
    } catch {
      // silent
    }
  }

  const handleDelete = async () => {
    try {
      await postsApi.deletePost(post.id)
      onDeleted?.()
    } catch {
      // silent
    }
  }

  const handleReactionEnter = () => {
    if (reactionTimeout.current) clearTimeout(reactionTimeout.current)
    setShowReactions(true)
  }

  const handleReactionLeave = () => {
    reactionTimeout.current = setTimeout(() => setShowReactions(false), 300)
  }

  const mediaUrls: string[] = (() => {
    if (!post.media_urls) return []
    try {
      const parsed = JSON.parse(post.media_urls)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  const renderMedia = () => {
    if (mediaUrls.length === 0) return null
    if (mediaUrls.length === 1) {
      return (
        <div className="mt-3 bg-bg-tertiary/50">
          {post.media_type === 'video' ? (
            <video src={mediaUrls[0]} controls className="w-full max-h-[500px] object-contain" />
          ) : (
            <img src={mediaUrls[0]} alt="" className="w-full max-h-[500px] object-cover cursor-pointer hover:brightness-95 transition-all" loading="lazy" />
          )}
        </div>
      )
    }
    if (mediaUrls.length === 2) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-0.5 overflow-hidden">
          {mediaUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full h-64 object-cover cursor-pointer hover:brightness-95 transition-all" loading="lazy" />
          ))}
        </div>
      )
    }
    return (
      <div className="mt-3 grid grid-cols-2 gap-0.5 overflow-hidden">
        <img src={mediaUrls[0]} alt="" className="w-full h-64 object-cover row-span-2 cursor-pointer hover:brightness-95 transition-all" loading="lazy" />
        <img src={mediaUrls[1]} alt="" className="w-full h-[calc(8rem-1px)] object-cover cursor-pointer hover:brightness-95 transition-all" loading="lazy" />
        <div className="relative">
          <img src={mediaUrls[2]} alt="" className="w-full h-[calc(8rem-1px)] object-cover cursor-pointer hover:brightness-95 transition-all" loading="lazy" />
          {mediaUrls.length > 3 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">
              +{mediaUrls.length - 3}
            </div>
          )}
        </div>
      </div>
    )
  }

  const fullDate = new Date(post.created_at).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="card overflow-hidden animate-slide-up" style={style}>
      {/* Author header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <Link to={`/profile/${post.author_id}`} className="flex items-center gap-3 group">
            <UserAvatar
              src={author?.profile_photo_url}
              firstName={author?.first_name}
              lastName={author?.last_name}
              verificationType={author?.verification_type}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {author?.first_name} {author?.last_name}
                </span>
                <VerificationBadge type={author?.verification_type} size={14} />
              </div>
              <p className="text-xs text-text-secondary leading-tight">
                {author?.profile?.category || author?.email}
              </p>
              <p className="text-[10px] text-text-muted leading-tight" title={fullDate}>
                {formatDate(post.created_at)}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSaved(!saved)}
              className={cn(
                'rounded-full p-1.5 transition-colors',
                saved ? 'text-primary' : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary',
              )}
              title={saved ? 'Unsave' : 'Save'}
            >
              <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
            </button>

            {post.author_id === user?.id && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="rounded-full p-1.5 hover:bg-bg-secondary text-text-muted transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-card shadow-xl z-10 overflow-hidden animate-fade-in">
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-bg-secondary transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Delete post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content with truncation */}
        <div className="mt-3">
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          {isLong && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-sm font-medium text-text-secondary hover:text-primary transition-colors mt-0.5"
            >
              ...see more
            </button>
          )}
        </div>
      </div>

      {/* Media */}
      {renderMedia()}

      {/* Engagement stats */}
      {(likesCount > 0 || commentsCount > 0 || post.shares_count > 0) && (
        <div className="flex items-center justify-between px-4 py-2.5 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            {likesCount > 0 && (
              <span className="flex items-center gap-1 hover:text-primary hover:underline cursor-pointer">
                <span className="flex -space-x-0.5">
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[8px] text-white ring-1 ring-card">
                    <ThumbsUp className="h-2.5 w-2.5" />
                  </span>
                  {likesCount > 1 && (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-rose-500 text-[8px] text-white ring-1 ring-card">
                      <Heart className="h-2.5 w-2.5" />
                    </span>
                  )}
                </span>
                <span>{likesCount}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {commentsCount > 0 && (
              <button onClick={() => setShowComments(!showComments)} className="hover:text-primary hover:underline transition-colors">
                {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
              </button>
            )}
            {post.shares_count > 0 && (
              <span>{post.shares_count} repost{post.shares_count !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      )}

      {/* Action bar with reaction picker */}
      <div className="flex items-center border-t border-border">
        <div
          className="relative flex-1"
          onMouseEnter={handleReactionEnter}
          onMouseLeave={handleReactionLeave}
        >
          <button
            onClick={handleLike}
            className={cn(
              'flex w-full items-center justify-center gap-2 py-3 text-sm font-medium transition-colors hover:bg-bg-secondary',
              liked ? 'text-primary' : 'text-text-secondary',
            )}
          >
            <ThumbsUp className={cn(
              'h-[18px] w-[18px] transition-transform',
              liked && 'fill-current',
              likeAnimating && 'animate-like-pop',
            )} />
            Like
          </button>

          {showReactions && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1.5 shadow-xl animate-fade-in"
              onMouseEnter={handleReactionEnter}
              onMouseLeave={handleReactionLeave}
            >
              {reactions.map(({ icon: Icon, label, color }) => (
                <button
                  key={label}
                  onClick={handleLike}
                  title={label}
                  className="rounded-full p-1.5 hover:bg-bg-secondary hover:scale-125 transition-all"
                >
                  <Icon className={cn('h-5 w-5', color)} />
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
        >
          <MessageCircle className="h-[18px] w-[18px]" /> Comment
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary">
          <Share2 className="h-[18px] w-[18px]" /> Repost
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id} onCommentCountChange={setCommentsCount} />
      )}
    </div>
  )
}
