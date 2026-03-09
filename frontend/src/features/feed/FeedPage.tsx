import { useState, useEffect, useCallback, useRef } from 'react'
import { Image, Video, FileText, Sparkles, PenLine } from 'lucide-react'
import { postsApi } from '@/api/posts'
import { PostComposer } from './PostComposer'
import { PostCard } from './PostCard'
import { PostSkeleton } from '@/components/shared/PostSkeleton'
import { cn } from '@/lib/utils'
import type { Post } from '@/types'

type SortMode = 'recent' | 'top'
type FilterMode = 'all' | 'image' | 'video'

const filters = [
  { value: 'all' as const, label: 'All Posts', icon: null },
  { value: 'image' as const, label: 'Photos', icon: Image },
  { value: 'video' as const, label: 'Videos', icon: Video },
]

export function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sort, setSort] = useState<SortMode>('recent')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (skip = 0, append = false) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)
    try {
      const { data } = await postsApi.getFeed({ skip, limit: 10, sort })
      const filtered = filter === 'all' ? data : data.filter((p: Post) => p.media_type === filter)
      if (append) {
        setPosts((prev) => [...prev, ...filtered])
      } else {
        setPosts(filtered)
      }
      setHasMore(data.length === 10)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [sort, filter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true)
          fetchPosts(posts.length, true)
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, posts.length, fetchPosts])

  const handlePostCreated = () => fetchPosts()

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="space-y-4">
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Filter & Sort Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
          {filters.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border',
                filter === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-text-secondary hover:bg-bg-secondary hover:border-text-muted',
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-full bg-bg-tertiary p-0.5 flex-shrink-0">
          {(['recent', 'top'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all',
                sort === s
                  ? 'bg-card text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {s === 'recent' ? 'Recent' : 'Top'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-16 text-center animate-fade-in">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-5">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Your Feed is Empty</h3>
          <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto leading-relaxed">
            {filter !== 'all'
              ? `No ${filter === 'image' ? 'photo' : 'video'} posts yet. Try switching to "All Posts".`
              : 'Follow artists and organizers to see their updates here, or share something yourself!'}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => {
                const btn = document.querySelector<HTMLButtonElement>('[data-composer-trigger]')
                btn?.click()
              }}
              className="btn-primary"
            >
              <PenLine className="h-4 w-4" /> Create a Post
            </button>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="btn-secondary">
                <FileText className="h-4 w-4" /> Show All Posts
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={() => handlePostDeleted(post.id)}
              style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {loadingMore && (
            <div className="space-y-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          )}

          {!hasMore && posts.length > 3 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-bg-tertiary/50 px-5 py-2 text-xs text-text-muted">
                <Sparkles className="h-3.5 w-3.5" />
                You&apos;re all caught up!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
