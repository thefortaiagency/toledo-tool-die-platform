'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login attempt:', { email, data, error })

      if (error) throw error

      if (data?.session) {
        console.log('Login successful, redirecting...')
        // Force redirect to home after successful login
        window.location.href = '/'
      } else {
        throw new Error('No session returned from login')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/login-background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* Content container with higher z-index */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
        <Card className="w-full backdrop-blur-md bg-white/95 shadow-2xl">
        <CardHeader className="text-center py-6 sm:py-8">
          <div className="bg-slate-800 p-4 sm:p-6 rounded-lg mx-auto mb-4 sm:mb-6 inline-block">
            <img 
              src="/toledo-logo.png" 
              alt="Toledo Tool & Die" 
              className="h-16 sm:h-20 md:h-24 w-auto"
            />
          </div>
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">Production Platform Login</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800 text-xs sm:text-sm">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm sm:text-base font-medium mb-2 sm:mb-3">
                <Mail className="inline h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="your.email@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium mb-2 sm:mb-3">
                <Lock className="inline h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 py-3 sm:py-4 md:py-6 text-base sm:text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 sm:mt-8 text-center text-sm sm:text-base text-gray-600">
            <p>Authorized personnel only</p>
            <p className="mt-2">Contact IT support for access issues</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}