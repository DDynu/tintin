import { useState } from 'react'
import { chatApi } from '../api/client'

interface Props {
  onClose: () => void
  onCreated: () => void
  refresh: () => void
}

export function NewChatModal({ onClose, onCreated, refresh }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'dm' | 'group'>('dm')
  const [participants, setParticipants] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await chatApi.createChat({
        type,
        name: name || null,
        participantUsernames: participants.split(',').map(s => s.trim()).filter(Boolean),
      })
      onCreated()
      onClose()
    } catch {
      setError('Failed to create chat')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 rounded-lg p-6 w-full max-w-sm"
      >
        <h2 className="text-lg font-bold mb-4">New Chat</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Chat name (optional)"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'dm' | 'group')}
            className="w-full bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dm">DM</option>
            <option value="group">Group</option>
          </select>
          <input
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            className="w-full bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Usernames (comma-separated)"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white rounded py-2 hover:bg-blue-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { onClose(); refresh() }}
              className="flex-1 bg-gray-700 text-white rounded py-2 hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
