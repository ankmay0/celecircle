import { useState } from 'react'
import { MessageSquare, Search, Send, MoreHorizontal, Phone, Video, Smile } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from '@/components/shared/UserAvatar'

interface Conversation {
  id: number
  name: string
  initials: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
}

const demoConversations: Conversation[] = [
  { id: 1, name: 'Priya Sharma', initials: 'PS', lastMessage: 'Looking forward to the event!', time: '2m', unread: 2, online: true },
  { id: 2, name: 'Rahul Mehta', initials: 'RM', lastMessage: 'Can we discuss the budget?', time: '1h', unread: 0, online: true },
  { id: 3, name: 'Ananya Roy', initials: 'AR', lastMessage: 'Thanks for connecting!', time: '3h', unread: 1, online: false },
  { id: 4, name: 'Vikram Singh', initials: 'VS', lastMessage: 'Sent you the portfolio.', time: '1d', unread: 0, online: false },
  { id: 5, name: 'Neha Kapoor', initials: 'NK', lastMessage: 'Great performance yesterday!', time: '2d', unread: 0, online: false },
]

export function MessagingPage() {
  const user = useAuthStore((s) => s.user)
  const [selected, setSelected] = useState<Conversation | null>(demoConversations[0])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const filtered = demoConversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="card overflow-hidden flex" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Conversation list */}
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text-primary">Messaging</h2>
            <button className="rounded-full p-1.5 hover:bg-bg-secondary text-text-muted transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages"
              className="input-field !pl-9 !rounded-full !py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary ${
                selected?.id === conv.id ? 'bg-primary/5 border-l-2 border-primary' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {conv.initials}
                </div>
                {conv.online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary truncate">{conv.name}</p>
                  <span className="text-[10px] text-text-muted flex-shrink-0">{conv.time}</span>
                </div>
                <p className="text-xs text-text-secondary truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <div className="h-5 min-w-[20px] rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white px-1">{conv.unread}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selected ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {selected.initials}
                </div>
                {selected.online && (
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{selected.name}</p>
                <p className="text-[11px] text-text-muted">{selected.online ? 'Active now' : 'Offline'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="rounded-full p-2 hover:bg-bg-secondary text-text-muted transition-colors">
                <Phone className="h-4 w-4" />
              </button>
              <button className="rounded-full p-2 hover:bg-bg-secondary text-text-muted transition-colors">
                <Video className="h-4 w-4" />
              </button>
              <button className="rounded-full p-2 hover:bg-bg-secondary text-text-muted transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="text-center">
              <p className="text-xs text-text-muted bg-bg-secondary inline-block rounded-full px-3 py-1">Today</p>
            </div>
            <div className="flex gap-2 max-w-[75%]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0 mt-1">
                {selected.initials}
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-bg-secondary px-4 py-2.5">
                <p className="text-sm text-text-primary">{selected.lastMessage}</p>
                <p className="text-[10px] text-text-muted mt-1">{selected.time} ago</p>
              </div>
            </div>
            <div className="flex gap-2 max-w-[75%] ml-auto flex-row-reverse">
              <UserAvatar
                src={user?.profile_photo_url}
                firstName={user?.first_name}
                lastName={user?.last_name}
                size="sm"
                className="mt-1"
              />
              <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5">
                <p className="text-sm text-white">Sounds great! Let me know the details.</p>
                <p className="text-[10px] text-white/60 mt-1">Just now</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <button className="rounded-full p-2 hover:bg-bg-secondary text-text-muted transition-colors flex-shrink-0">
                <Smile className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 rounded-full border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && message.trim() && setMessage('')}
              />
              <button
                disabled={!message.trim()}
                className="rounded-full p-2.5 bg-primary text-white disabled:opacity-40 hover:bg-primary-hover transition-colors flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary">Your Messages</h3>
            <p className="text-sm text-text-secondary mt-1">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )
}
