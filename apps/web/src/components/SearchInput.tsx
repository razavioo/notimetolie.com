'use client'

import { useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function SearchInput({ 
  value, 
  onChange, 
  onSearch, 
  isLoading = false,
  placeholder = "Search..."
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSearch(value.trim())
    }
  }

  const handleClear = () => {
    onChange('')
    setIsFocused(true)
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <SearchIcon 
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground ${
              isLoading ? 'animate-pulse' : ''
            }`} 
            size={20} 
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear search"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </form>
      
      {value && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10">
          <div className="p-3">
            <button
              onClick={() => onSearch(value)}
              className="w-full text-left px-2 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
            >
              Search for "{value}"
            </button>
          </div>
        </div>
      )}
    </div>
  )
}