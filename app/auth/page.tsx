'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp, useSession } from '@/lib/auth-client'

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { data: session } = useSession()

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      router.push('/today')
    }
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isSignIn) {
        const result = await signIn.email({
          email,
          password,
        })
        if (result.error) {
          setError(result.error.message || 'Authentication failed')
        } else {
          router.push('/today')
        }
      } else {
        const result = await signUp.email({
          email,
          password,
          name,
        })
        if (result.error) {
          setError(result.error.message || 'Authentication failed')
        } else {
          router.push('/today')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isSignIn ? 'Sign In' : 'Sign Up'}
          </h1>
          <p className="text-slate-600">
            {isSignIn ? 'Welcome back to your habit tracker' : 'Start tracking your habits today'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSignIn && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isSignIn}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Password (min 6 characters)"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Loading...' : (isSignIn ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              setIsSignIn(!isSignIn)
              setError('')
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isSignIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  )
}