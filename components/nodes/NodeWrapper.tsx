interface NodeWrapperProps {
  id?: string // kept in interface for backwards compat
  selected?: boolean
  className?: string
  children: React.ReactNode
}

export function NodeWrapper({ className, children }: NodeWrapperProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {children}
    </div>
  )
}
