import { useState, useRef } from 'react'
import { Image, Video, X, Loader2, Globe, Users as UsersIcon, CalendarDays, FileText, Smile } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { assetUrl } from '@/lib/utils'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { postsApi } from '@/api/posts'

interface PostComposerProps {
  onPostCreated: () => void
}

const mediaActions = [
  { icon: Image, label: 'Photo', color: 'text-blue-500', type: 'image' as const },
  { icon: Video, label: 'Video', color: 'text-emerald-500', type: 'video' as const },
  { icon: CalendarDays, label: 'Event', color: 'text-amber-500', type: null },
  { icon: FileText, label: 'Article', color: 'text-rose-500', type: null },
]

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const user = useAuthStore((s) => s.user)
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [audience, setAudience] = useState<'anyone' | 'connections'>('anyone')
  const [loading, setLoading] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null, type: 'image' | 'video') => {
    if (!files) return
    const newFiles = Array.from(files)
    setMediaType(type)
    setMediaFiles((prev) => [...prev, ...newFiles])
    const previews = newFiles.map((f) => URL.createObjectURL(f))
    setMediaPreviews((prev) => [...prev, ...previews])
  }

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index])
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index))
    if (mediaFiles.length <= 1) setMediaType('text')
  }

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return
    setLoading(true)
    try {
      await postsApi.createPost({
        content: content.trim(),
        media_type: mediaType,
        files: mediaFiles.length > 0 ? mediaFiles : undefined,
      })
      setContent('')
      setMediaFiles([])
      setMediaPreviews([])
      setMediaType('text')
      setIsOpen(false)
      onPostCreated()
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setContent('')
    setMediaFiles([])
    mediaPreviews.forEach(URL.revokeObjectURL)
    setMediaPreviews([])
    setMediaType('text')
    setIsOpen(false)
  }

  const handleActionClick = (type: 'image' | 'video' | null) => {
    if (!type) return
    setIsOpen(true)
    setTimeout(() => {
      if (type === 'image') imageRef.current?.click()
      else videoRef.current?.click()
    }, 100)
  }

  return (
    <>
      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={assetUrl(user?.profile_photo_url)}
            firstName={user?.first_name}
            lastName={user?.last_name}
            verificationType={user?.verification_type}
          />
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 rounded-full border border-border bg-bg-primary px-5 py-2.5 text-left text-sm text-text-muted hover:bg-bg-secondary hover:border-text-muted transition-all"
          >
            Start a post...
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          {mediaActions.map(({ icon: Icon, label, color, type }) => (
            <button
              key={label}
              onClick={() => type ? handleActionClick(type) : undefined}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors flex-1 justify-center"
            >
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create post modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) reset() }}>
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl max-h-[90vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Create a Post</h3>
              <button onClick={reset} className="rounded-full p-1.5 hover:bg-bg-secondary transition-colors">
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar
                  src={assetUrl(user?.profile_photo_url)}
                  firstName={user?.first_name}
                  lastName={user?.last_name}
                  verificationType={user?.verification_type}
                />
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <button
                    onClick={() => setAudience(audience === 'anyone' ? 'connections' : 'anyone')}
                    className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-text-secondary hover:bg-bg-secondary transition-colors mt-0.5"
                  >
                    {audience === 'anyone' ? <Globe className="h-3 w-3" /> : <UsersIcon className="h-3 w-3" />}
                    {audience === 'anyone' ? 'Anyone' : 'Connections only'}
                  </button>
                </div>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to talk about?"
                className="w-full resize-none bg-transparent text-text-primary placeholder:text-text-muted outline-none text-base leading-relaxed min-h-[140px]"
                autoFocus
              />

              {mediaPreviews.length > 0 && (
                <div className="mt-3 grid gap-2 grid-cols-2">
                  {mediaPreviews.map((url, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden bg-bg-secondary group">
                      {mediaType === 'video' ? (
                        <video src={url} className="w-full h-40 object-cover" />
                      ) : (
                        <img src={url} alt="" className="w-full h-40 object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-bg-secondary/30">
              <div className="flex items-center gap-0.5">
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, 'image')}
                />
                <button
                  onClick={() => imageRef.current?.click()}
                  className="rounded-full p-2.5 hover:bg-bg-secondary text-text-secondary transition-colors"
                  title="Add photo"
                >
                  <Image className="h-5 w-5 text-blue-500" />
                </button>
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, 'video')}
                />
                <button
                  onClick={() => videoRef.current?.click()}
                  className="rounded-full p-2.5 hover:bg-bg-secondary text-text-secondary transition-colors"
                  title="Add video"
                >
                  <Video className="h-5 w-5 text-emerald-500" />
                </button>
                <button className="rounded-full p-2.5 hover:bg-bg-secondary text-text-secondary transition-colors" title="Add emoji">
                  <Smile className="h-5 w-5 text-amber-500" />
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || (!content.trim() && mediaFiles.length === 0)}
                className="btn-primary !px-7 !rounded-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
