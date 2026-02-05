'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DragicaLogo from '@/components/DragicaLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Neispravna email adresa ili lozinka')
        setLoading(false)
        return
      }

      if (data.user) {
        // Get user role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (userData?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('Došlo je do greške. Molimo pokušajte ponovo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Pop Art Background Pattern */}
      <div className="absolute inset-0 dots-pattern pointer-events-none" />

      {/* Decorative shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-secondary rounded-full border-4 border-foreground shadow-[6px_6px_0px_#1B4332] hidden md:block" />
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent rounded-lg border-4 border-foreground shadow-[6px_6px_0px_#1B4332] rotate-12 hidden md:block" />
      <div className="absolute top-1/3 right-10 w-16 h-16 bg-primary rounded-full border-4 border-foreground shadow-[4px_4px_0px_#1B4332] hidden md:block" />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-card border-4 border-foreground rounded-xl shadow-[8px_8px_0px_#1B4332] overflow-hidden">
          {/* Header */}
          <div className="bg-secondary border-b-4 border-foreground p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <DragicaLogo size="xl" />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              Dragica
            </h1>
            <p className="text-base text-foreground/80 font-semibold mt-1 italic">Tvoja pomoćnica</p>
          </div>

          {/* Form */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center uppercase tracking-wide">
              Prijava
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wide text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 text-base border-3 border-foreground bg-white shadow-[3px_3px_0px_#1B4332] focus:shadow-[4px_4px_0px_#1B4332] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wide text-foreground">
                  Lozinka
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 text-base border-3 border-foreground bg-white shadow-[3px_3px_0px_#1B4332] focus:shadow-[4px_4px_0px_#1B4332] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all"
                />
              </div>

              {error && (
                <div className="text-sm text-white bg-accent border-3 border-foreground rounded-lg p-3 shadow-[3px_3px_0px_#1B4332] font-bold text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold uppercase tracking-wide border-3 border-foreground shadow-[4px_4px_0px_#1B4332] hover:shadow-[5px_5px_0px_#1B4332] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_#1B4332] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                disabled={loading}
              >
                {loading ? 'Prijava...' : 'Prijavite se'}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-foreground/50 mt-6 font-medium">
          Salon Management System
        </p>
      </div>
    </div>
  )
}
