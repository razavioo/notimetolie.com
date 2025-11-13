import React from 'react'

interface PageHeaderProps {
  title: string | React.ReactNode
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, icon, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex justify-between items-start mb-8 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 mt-1">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold mb-1">
            {typeof title === 'string' ? title : <>{title}</>}
          </h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
