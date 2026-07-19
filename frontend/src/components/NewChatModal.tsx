import { useState, useEffect, useRef } from 'react'
import { chatApi } from '../api/client'
import { UserAutocomplete } from './UserAutocomplete'
import type { User } from '../types'

interface Props {
  onClose: () => void
  onCreated: () => void
  refresh: () => void
}

export function NewChatModal({ onClose, onCreated, refresh }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'dm' | 'group'>('dm')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (type === 'dm' && selectedUsers.length !== 1) {
      setError('Select exactly one user for direct message')
      return
    }
    if (type === 'group' && selectedUsers.length < 2) {
      setError('Select at least 2 users for a group chat')
      return
    }

    setLoading(true)
    try {
      await chatApi.createChat({
        type,
        name: name || null,
        participantUsernames: selectedUsers.map(u => u.username),
      })
      onCreated()
      refresh()
      onClose()
    } catch {
      setError('Failed to create chat')
    }
    setLoading(false)
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 bg-bg-deep/60 backdrop-blur-sm flex items-center justify-center z-50 animate-overlay-fade
        md:items-center"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-bg-base border border-border rounded-xl p-6 w-full max-w-sm animate-scale-in shadow-2xl
          md:rounded-xl md:animate-scale-in
          rounded-t-2xl 
          mx-4 mb-0 md:mb-auto
          max-h-[85vh] md:max-h-none
          overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-text-primary">New Chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-dim hover:text-text-secondary transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg-surface text-text-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-border placeholder-text-dim"
            placeholder="Chat name (optional)"
          />

          <div className="flex gap-2">
            {(['dm', 'group'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === t
                    ? 'bg-amber text-bg-base'
                    : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'
                  }`}
              >
                {t === 'dm' ? 'Direct Message' : 'Group'}
              </button>
            ))}
          </div>

          <UserAutocomplete
            excludeIds={[]}
            onSelectionChange={setSelectedUsers}
            placeholder={type === 'dm' ? 'Search user...' : 'Search users...'}
          />

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber text-bg-base text-sm font-medium rounded-lg hover:bg-amber-glow transition-colors disabled:opacity-30"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-bg-surface text-text-secondary text-sm rounded-lg hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
