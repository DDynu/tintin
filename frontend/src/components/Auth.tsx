import { useState } from 'react'
import { motion, AnimatePresence, easeOut, easeInOut } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface AuthProps {
  isLogin: boolean
}

export function Auth({ isLogin }: AuthProps) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isLogin) {
        await login.mutateAsync({ username, password })
      } else {
        await register.mutateAsync({ username, email, password })
      }
      navigate('/')
    } catch (err) {
      console.log(err)
      setError(isLogin ? `err: ${err}` : 'Registration failed')
    }
  }

  const sharedTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    duration: 0.5
  }

  const titleTransition = {
    duration: 0.4,
    ease: easeOut
  }

  const subtitleTransition = {
    duration: 0.4,
    delay: 0.1,
    ease: easeOut
  }

  const formTransition = {
    duration: 0.5,
    ease: easeInOut
  }

  const linkTransition = {
    duration: 0.3,
    delay: 0.3,
    ease: easeOut
  }

  const errorTransition = {
    duration: 0.3,
    ease: easeInOut
  }

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Title Section */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-2xl font-semibold text-text-primary"
            layout
            transition={titleTransition}
          >
            {isLogin ? 'Welcome back' : 'Create account'}
          </motion.h1>
          <motion.p
            className="text-sm text-text-dim mt-2"
            layout
            transition={subtitleTransition}
          >
            {isLogin ? 'Sign in to your account' : 'Join the conversation'}
          </motion.p>
        </div>

        {/* Form Section - Gracefully morphs between login and register */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-bg-base border border-border rounded-2xl p-6 shadow-lg shadow-black/20 relative"
          layout
          transition={formTransition}
        >
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={errorTransition}
                className="text-xs text-red-400 mb-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex flex-col">
            {/* Username Input - Always visible */}
            <motion.input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-bg-surface text-text-primary rounded-xl mb-4 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 placeholder-text-dim"
              placeholder="Username"
              layout
              transition={sharedTransition}
              whileFocus={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            />

            {/* Email Input - Only in register, gracefully appears */}
            <motion.div
              className="overflow-hidden"
              transition={sharedTransition}
              initial={{
                height: isLogin ? 'auto' : 0,
                opacity: isLogin ? 1 : 0
              }}
              animate={{
                height: isLogin ? 0 : 'auto',
                opacity: isLogin ? 0 : 1
              }}
            >
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-surface text-text-primary rounded-xl mb-4 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 placeholder-text-dim"
                placeholder="Email"
                whileFocus={{ scale: 1.02, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              />
            </motion.div>

            {/* Password Input - Always visible */}
            <motion.input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-surface text-text-primary rounded-xl mb-4 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 placeholder-text-dim"
              placeholder="Password"
              layout
              transition={sharedTransition}
              whileFocus={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            />

            {/* Submit Button - Morphs text and behavior */}
            <motion.button
              type="submit"
              className="w-full py-3 bg-amber text-bg-base text-sm font-medium rounded-xl hover:bg-amber-glow transition-colors disabled:opacity-30"
              disabled={isLogin ? login.isPending : register.isPending}
              layout
              transition={sharedTransition}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {isLogin ? (login.isPending ? 'Signing in...' : 'Sign in') : (register.isPending ? 'Creating...' : 'Create account')}
              </motion.text>
            </motion.button>
          </div>

          {/* Link Section - Morphs text and direction */}
          <motion.p
            className="text-xs text-text-dim mt-5 text-center"
            layout
            transition={linkTransition}
          >
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <a href={isLogin ? '/register' : '/login'} className="text-amber hover:underline">
              {isLogin ? 'Register' : 'Sign in'}
            </a>
          </motion.p>
        </motion.form>
      </div>
    </div>
  )
}
