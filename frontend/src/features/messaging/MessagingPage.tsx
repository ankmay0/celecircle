import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  UserPlus,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { chatApi } from '@/api/chat'
import { connectionsApi } from '@/api/connections'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { VerificationBadge } from '@/components/shared/VerificationBadge'
import { cn } from '@/lib/utils'
import type { ChatMessage, Conversation } from '@/api/chat'

interface FollowedUser {
  user_id: number
  name: string | null
  category: string | null
  profile_photo_url: string | null
  verification_type: string | null
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { label: string; messages: ChatMessage[] }[] = []
  let currentLabel = ''
  for (const msg of messages) {
    const date = new Date(msg.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let label: string
    if (date.toDateString() === today.toDateString()) label = 'Today'
    else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = date.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })

    if (label !== currentLabel) {
      groups.push({ label, messages: [msg] })
      currentLabel = label
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  }
  return groups
}

function ConversationList({
  conversations,
  selectedUserId,
  onSelect,
  search,
  onSearchChange,
  loading,
  onNewChat,
}: {
  conversations: Conversation[]
  selectedUserId: number | null
  onSelect: (conv: Conversation) => void
  search: string
  onSearchChange: (v: string) => void
  loading: boolean
  onNewChat: () => void
}) {
  const filtered = conversations.filter((c) =>
    c.user_name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-text-primary">Messaging</h2>
          <button
            onClick={onNewChat}
            className="rounded-full p-1.5 hover:bg-bg-secondary text-primary transition-colors"
            title="New conversation"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages"
            className="input-field !pl-9 !rounded-full !py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              {search ? 'No conversations match your search' : 'No conversations yet'}
            </p>
            <button
              onClick={onNewChat}
              className="mt-3 text-sm text-primary font-medium hover:underline"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.user_id}
              onClick={() => onSelect(conv)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary',
                selectedUserId === conv.user_id && 'bg-primary/5 border-l-2 border-primary',
              )}
            >
              <UserAvatar
                src={conv.profile_photo_url}
                firstName={conv.user_name.split(' ')[0]}
                lastName={conv.user_name.split(' ')[1]}
                size="md"
                verificationType={conv.verification_type}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{conv.user_name}</p>
                    <VerificationBadge type={conv.verification_type} size={13} />
                  </div>
                  <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
                    {formatTime(conv.last_message_time)}
                  </span>
                </div>
                <p className={cn(
                  'text-xs truncate mt-0.5',
                  conv.unread_count > 0 ? 'text-text-primary font-medium' : 'text-text-secondary',
                )}>
                  {conv.last_message}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <div className="h-5 min-w-[20px] rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white px-1">{conv.unread_count}</span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function NewChatPicker({
  onSelect,
  onClose,
}: {
  onSelect: (user: FollowedUser) => void
  onClose: () => void
}) {
  const [following, setFollowing] = useState<FollowedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data } = await connectionsApi.getFollowing()
        setFollowing(data)
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = following.filter((u) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onClose} className="rounded-full p-1 hover:bg-bg-secondary">
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <h2 className="text-lg font-bold text-text-primary">New Message</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people you follow"
            className="input-field !pl-9 !rounded-full !py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <UserPlus className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              {search
                ? 'No followed users match your search'
                : 'Follow people to start messaging them'}
            </p>
          </div>
        ) : (
          filtered.map((u) => (
            <button
              key={u.user_id}
              onClick={() => onSelect(u)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-secondary transition-colors"
            >
              <UserAvatar
                src={u.profile_photo_url}
                firstName={u.name?.split(' ')[0]}
                lastName={u.name?.split(' ')[1]}
                size="md"
                verificationType={u.verification_type}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-text-primary truncate">{u.name || 'Unknown'}</p>
                  <VerificationBadge type={u.verification_type} size={13} />
                </div>
                {u.category && <p className="text-xs text-text-secondary truncate">{u.category}</p>}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function ChatArea({
  userId,
  userName,
  userPhoto,
  userCategory,
  verificationType,
  onBack,
}: {
  userId: number
  userName: string
  userPhoto?: string | null
  userCategory?: string | null
  verificationType?: string | null
  onBack?: () => void
}) {
  const currentUser = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<{ url: string; type: string; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadMessages = useCallback(async () => {
    try {
      const { data } = await chatApi.getConversation(userId)
      setMessages(data)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    loadMessages()
    pollRef.current = setInterval(loadMessages, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed && !attachment) return

    setSending(true)
    try {
      const payload: { receiver_id: number; message: string; attachment_url?: string; attachment_type?: string } = {
        receiver_id: userId,
        message: trimmed || (attachment ? `Sent ${attachment.type === 'image' ? 'a photo' : 'a file'}` : ''),
      }
      if (attachment) {
        payload.attachment_url = attachment.url
        payload.attachment_type = attachment.type
      }
      const { data } = await chatApi.sendMessage(payload)
      setMessages((prev) => [...prev, data])
      setText('')
      setAttachment(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send'
      if (msg.includes('follow')) {
        alert('You must follow this user before sending a message.')
      }
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await chatApi.uploadFile(file)
      setAttachment({ url: data.url, type: data.type, name: data.filename })
    } catch {
      /* silent */
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="rounded-full p-1 hover:bg-bg-secondary lg:hidden">
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
        )}
        <button
          onClick={() => navigate(`/profile/${userId}`)}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          <UserAvatar
            src={userPhoto}
            firstName={userName.split(' ')[0]}
            lastName={userName.split(' ')[1]}
            size="md"
            verificationType={verificationType}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-text-primary truncate">{userName}</p>
              <VerificationBadge type={verificationType} size={14} />
            </div>
            {userCategory && <p className="text-[11px] text-text-muted truncate">{userCategory}</p>}
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <MessageSquare className="h-12 w-12 text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">No messages yet. Say hello!</p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.label}>
              <div className="text-center my-4">
                <span className="text-[11px] text-text-muted bg-bg-secondary rounded-full px-3 py-1">
                  {group.label}
                </span>
              </div>
              {group.messages.map((msg) => {
                const isMine = msg.sender_id === currentUser?.id
                return (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2 mb-2', isMine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5',
                        isMine
                          ? 'bg-primary text-white rounded-tr-sm'
                          : 'bg-bg-secondary text-text-primary rounded-tl-sm',
                      )}
                    >
                      {msg.attachment_url && msg.attachment_type === 'image' && (
                        <img
                          src={msg.attachment_url}
                          alt="Attachment"
                          className="rounded-lg max-w-full max-h-60 mb-1"
                        />
                      )}
                      {msg.attachment_url && msg.attachment_type === 'file' && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            'flex items-center gap-2 text-xs mb-1',
                            isMine ? 'text-white/80 hover:text-white' : 'text-primary hover:underline',
                          )}
                        >
                          <FileText className="h-4 w-4" /> Download attachment
                        </a>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p
                        className={cn(
                          'text-[10px] mt-1',
                          isMine ? 'text-white/60' : 'text-text-muted',
                        )}
                      >
                        {formatMessageTime(msg.created_at)}
                        {isMine && msg.is_read && ' · Read'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div className="px-4 py-2 border-t border-border flex items-center gap-2 bg-bg-secondary/50">
          {attachment.type === 'image' ? (
            <ImageIcon className="h-4 w-4 text-primary" />
          ) : (
            <FileText className="h-4 w-4 text-primary" />
          )}
          <span className="text-xs text-text-secondary truncate flex-1">{attachment.name}</span>
          <button onClick={() => setAttachment(null)} className="text-text-muted hover:text-danger">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-full p-2 hover:bg-bg-secondary text-text-muted transition-colors flex-shrink-0"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 rounded-full border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || (!text.trim() && !attachment)}
            className="rounded-full p-2.5 bg-primary text-white disabled:opacity-40 hover:bg-primary-hover transition-colors flex-shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export function MessagingPage() {
  const { userId: paramUserId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await chatApi.listConversations()
      setConversations(data)
      return data
    } catch {
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConversations().then((convs) => {
      if (paramUserId) {
        const uid = Number(paramUserId)
        const existing = convs.find((c: Conversation) => c.user_id === uid)
        if (existing) {
          setSelectedConv(existing)
          setMobileShowChat(true)
        } else {
          setSelectedConv({
            user_id: uid,
            user_email: null,
            user_name: 'User',
            user_category: null,
            user_role: '',
            verification_type: null,
            profile_photo_url: null,
            last_message: '',
            last_message_time: null,
            unread_count: 0,
          })
          setMobileShowChat(true)
        }
      }
    })
  }, [loadConversations, paramUserId])

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv)
    setMobileShowChat(true)
    setShowNewChat(false)
    navigate(`/chat/${conv.user_id}`, { replace: true })
  }

  const handleNewChatSelect = (user: FollowedUser) => {
    const existingConv = conversations.find((c) => c.user_id === user.user_id)
    if (existingConv) {
      handleSelectConversation(existingConv)
    } else {
      const newConv: Conversation = {
        user_id: user.user_id,
        user_email: null,
        user_name: user.name || 'Unknown',
        user_category: user.category,
        user_role: '',
        verification_type: user.verification_type,
        profile_photo_url: user.profile_photo_url,
        last_message: '',
        last_message_time: null,
        unread_count: 0,
      }
      setSelectedConv(newConv)
      setMobileShowChat(true)
      setShowNewChat(false)
      navigate(`/chat/${user.user_id}`, { replace: true })
    }
  }

  const handleBack = () => {
    setMobileShowChat(false)
    setSelectedConv(null)
    navigate('/chat', { replace: true })
    loadConversations()
  }

  return (
    <div className="card overflow-hidden flex" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Left panel: conversation list / new chat picker */}
      <div
        className={cn(
          'w-full lg:w-80 border-r border-border flex-shrink-0',
          mobileShowChat ? 'hidden lg:flex lg:flex-col' : 'flex flex-col',
        )}
      >
        {showNewChat ? (
          <NewChatPicker
            onSelect={handleNewChatSelect}
            onClose={() => setShowNewChat(false)}
          />
        ) : (
          <ConversationList
            conversations={conversations}
            selectedUserId={selectedConv?.user_id ?? null}
            onSelect={handleSelectConversation}
            search={search}
            onSearchChange={setSearch}
            loading={loading}
            onNewChat={() => setShowNewChat(true)}
          />
        )}
      </div>

      {/* Right panel: chat area */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          mobileShowChat ? 'flex' : 'hidden lg:flex',
        )}
      >
        {selectedConv ? (
          <ChatArea
            userId={selectedConv.user_id}
            userName={selectedConv.user_name}
            userPhoto={selectedConv.profile_photo_url}
            userCategory={selectedConv.user_category}
            verificationType={selectedConv.verification_type}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Your Messages</h3>
              <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto">
                Select a conversation or start a new one with people you follow
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="btn-primary mt-4 !px-6"
              >
                <UserPlus className="h-4 w-4" /> New Message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
