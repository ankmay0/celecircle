interface AdminPageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
