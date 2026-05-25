import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register.mutateAsync({ username, email, password })
      navigate('/')
    } catch {
      setError('Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text-primary">Create account</h1>
          <p className="text-sm text-text-dim mt-2">Join the conversation</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-base border border-border rounded-2xl p-6
          shadow-lg shadow-black/20">
          {error && (
            <p className="text-xs text-red-400 mb-4">{error}</p>
          )}
          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-bg-surface text-text-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 placeholder-text-dim"
              placeholder="Username"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-surface text-text-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 placeholder-text-dim"
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-surface text-text-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 placeholder-text-dim"
              placeholder="Password"
            />
            <button
              type="submit"
              className="w-full py-3 bg-amber text-bg-base text-sm font-medium rounded-xl hover:bg-amber-glow transition-colors disabled:opacity-30 active:scale-[0.98]"
              disabled={register.isPending}
            >
              {register.isPending ? 'Creating...' : 'Create account'}
            </button>
          </div>
          <p className="text-xs text-text-dim mt-5 text-center">
            Already have an account?{' '}
            <a href="/login" className="text-amber hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
