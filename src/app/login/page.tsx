'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(searchParams.get('tab') === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Ελέγξτε το email σας για επιβεβαίωση.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push('/app')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-kbg flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kaccent to-kpurple flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="font-display text-[20px] font-bold tracking-tight">Shared Expenses</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-kcard border border-kborder rounded-2xl p-8">
          <h1 className="font-display text-[22px] font-bold text-center mb-1">
            {isSignUp ? 'Δημιουργία Λογαριασμού' : 'Καλώς ήρθατε'}
          </h1>
          <p className="text-[14px] text-ksec text-center mb-6">
            {isSignUp ? 'Ξεκινήστε δωρεάν σε 2 λεπτά' : 'Συνδεθείτε στον λογαριασμό σας'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isSignUp && (
              <div>
                <label className="block text-[12px] font-semibold text-ksec mb-1.5">Ονοματεπώνυμο</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="π.χ. Κώστας Μιχαηλίδης"
                  required
                  className="w-full px-3.5 py-2.5 bg-kbg border border-kborder rounded-lg text-[14px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-0 transition"
                />
              </div>
            )}
            <div>
              <label className="block text-[12px] font-semibold text-ksec mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 bg-kbg border border-kborder rounded-lg text-[14px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-0 transition"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ksec mb-1.5">Κωδικός</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 bg-kbg border border-kborder rounded-lg text-[14px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-0 transition"
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-kred/10 border border-kred/20 rounded-lg text-[13px] text-kred">
                {error}
              </div>
            )}
            {success && (
              <div className="px-3 py-2 bg-kgreen/10 border border-kgreen/20 rounded-lg text-[13px] text-kgreen">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 bg-gradient-to-r from-kaccent to-kpurple text-white font-semibold text-[14px] rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Περιμένετε...' : isSignUp ? 'Εγγραφή' : 'Σύνδεση'}
            </button>
          </form>

          {!isSignUp && (
            <div className="text-center mt-3">
              <button className="text-[13px] text-kaccent hover:underline">
                Ξεχάσατε τον κωδικό;
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-kborder text-center">
            <p className="text-[13px] text-kmut">
              {isSignUp ? 'Έχετε ήδη λογαριασμό;'  : 'Δεν έχετε λογαριασμό;'}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
                className="text-kaccent font-semibold hover:underline"
              >
                {isSignUp ? 'Σύνδεση →' : 'Εγγραφή δωρεάν →'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-kbg" />}>
      <LoginForm />
    </Suspense>
  )
}
