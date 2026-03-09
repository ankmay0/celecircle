export function PostSkeleton() {
  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full skeleton-shimmer flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-36 rounded-full skeleton-shimmer" />
            <div className="h-2.5 w-24 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="h-3 w-full rounded-full skeleton-shimmer" />
          <div className="h-3 w-[85%] rounded-full skeleton-shimmer" />
          <div className="h-3 w-[60%] rounded-full skeleton-shimmer" />
        </div>
      </div>
      <div className="mx-4 h-52 rounded-lg skeleton-shimmer mb-4" />
      <div className="flex items-center gap-4 px-4 pb-3">
        <div className="h-2.5 w-16 rounded-full skeleton-shimmer" />
        <div className="h-2.5 w-20 rounded-full skeleton-shimmer" />
      </div>
      <div className="border-t border-border flex">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex justify-center py-3.5">
            <div className="h-4 w-14 rounded-full skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}
