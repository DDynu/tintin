import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { authApi } from '../api/client'
import type { User } from '../types'

interface Props {
  /** Callback when the full selected users list changes */
  onSelectionChange: (selectedUsers: User[]) => void
  /** User IDs to exclude from suggestions (e.g. current chat members) */
  excludeIds?: number[]
  /** Placeholder text */
  placeholder?: string
}

export function UserAutocomplete({ onSelectionChange, excludeIds = [], placeholder = 'Search users...' }: Props) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Internal selected users state
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds])

  // Notify parent when selected users change
  useEffect(() => {
    onSelectionChange(selectedUsers)
  }, [selectedUsers, onSelectionChange])

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setUsers([])
      setIsOpen(false)
      setHighlightIndex(-1)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await authApi.searchUsers(trimmed)
        const filtered = results.filter(u => !excludeSet.has(u.id))
        setUsers(filtered)
        setIsOpen(filtered.length > 0)
      } catch {
        setUsers([])
        setIsOpen(false)
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, excludeSet])

  const addSelectedUser = useCallback((user: User) => {
    setSelectedUsers(prev => {
      if (prev.some(u => u.id === user.id)) return prev
      return [...prev, user]
    })
    setQuery('')
    setUsers([])
    setIsOpen(false)
    setHighlightIndex(-1)
    inputRef.current?.focus()
  }, [])

  const removeSelectedUser = useCallback((userId: number) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId))
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(prev => Math.min(prev + 1, users.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < users.length) {
        addSelectedUser(users[highlightIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }, [users, highlightIndex, addSelectedUser])

  return (
    <div className="relative">
      {/* Selected user chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-amber/20 text-amber text-xs rounded-full"
            >
              <span className="font-medium">@{user.username}</span>
              <button
                onClick={() => removeSelectedUser(user.id)}
                className="hover:text-red-400 transition-colors"
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setHighlightIndex(-1)
        }}
        onFocus={() => users.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-bg-surface text-text-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-border placeholder-text-dim"
      />

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-bg-base border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {loading ? (
            <div className="px-3 py-2 text-xs text-text-dim">Searching...</div>
          ) : users.length === 0 ? (
            <div className="px-3 py-2 text-xs text-text-dim">No users found</div>
          ) : (
            <ul className="py-1">
              {users.map((user, index) => (
                <li
                  key={user.id}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                    index === highlightIndex ? 'bg-bg-hover' : 'hover:bg-bg-hover/50'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    addSelectedUser(user)
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-linear-to-br from-amber to-amber-dim flex items-center justify-center text-bg-base text-xs font-bold shrink-0">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-text-primary truncate">{user.username}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
