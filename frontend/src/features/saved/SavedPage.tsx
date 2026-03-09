import { Bookmark, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SavedPage() {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h1 className="text-xl font-bold text-text-primary">Saved Items</h1>
        <p className="text-xs text-text-secondary mt-0.5">Posts and gigs you've bookmarked</p>
      </div>

      <div className="card p-16 text-center animate-fade-in">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-5">
          <Bookmark className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">No Saved Items</h3>
        <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto leading-relaxed">
          Bookmark posts and gigs you want to revisit later. They'll appear here.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <Link to="/feed" className="btn-primary">
            <Sparkles className="h-4 w-4" /> Browse Feed
          </Link>
          <Link to="/gigs" className="btn-secondary">
            Browse Gigs
          </Link>
        </div>
      </div>
    </div>
  )
}
