'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DragicaLogo from '@/components/DragicaLogo'
import { LogIn, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Contact info - replace with actual values
const CONTACT = {
  phone: '+381 60 3794383',
  phoneClean: '+381603794383',
  whatsapp: '+381603794383',
  viber: '+381603794383',
}

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [demoLoading, setDemoLoading] = useState<'admin' | 'owner' | null>(null)
  const [demoError, setDemoError] = useState('')

  const handleDemoLogin = async (type: 'admin' | 'owner') => {
    setDemoError('')
    setDemoLoading(type)

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const data = await res.json()

      if (!res.ok) {
        setDemoError(data.error || 'Greška pri demo prijavi')
        setDemoLoading(null)
        return
      }

      router.push(data.redirect)
    } catch (err) {
      setDemoError('Došlo je do greške. Molimo pokušajte ponovo.')
      setDemoLoading(null)
    }
  }

  useEffect(() => {
    // Check for auth hash in URL (from Supabase invite/magic link)
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      // Parse the hash to check if it's an invite
      const params = new URLSearchParams(hash.substring(1))
      const type = params.get('type')

      // Handle the auth session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // If it's an invite, go to setup page
          if (type === 'invite' || type === 'recovery' || type === 'signup') {
            router.push('/setup')
          } else {
            // Otherwise go to dashboard
            router.push('/dashboard')
          }
        }
      })
    }
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-[#E4EDE6] flex flex-col">
      {/* Decorative shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#C5E8CB] rounded-full border-4 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] opacity-50 hidden md:block" />
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-[#E76F51] rounded-lg border-4 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] rotate-12 opacity-40 hidden md:block" />
        <div className="absolute top-1/3 right-10 w-16 h-16 bg-[#2D6A4F] rounded-full border-4 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] opacity-30 hidden md:block" />
        <div className="absolute bottom-1/3 left-20 w-20 h-20 bg-[#B8DEC0] rounded-lg border-4 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] -rotate-6 opacity-40 hidden md:block" />
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full">
          {/* Hero section */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <DragicaLogo size="xl" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#1B4332] tracking-tight mb-2">
              Dragica
            </h1>
            <p className="text-xl text-[#1B4332]/80 font-semibold italic">
              Tvoja pomoćnica
            </p>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            {/* Contact Card */}
            <div className="bg-white border-4 border-[#1B4332] rounded-xl shadow-[6px_6px_0px_#1B4332] overflow-hidden">
              <div className="bg-[#C5E8CB] border-b-4 border-[#1B4332] px-5 py-4">
                <p className="text-[#1B4332] font-bold text-center">
                  Želiš da ti Dragica bude pomoćnica?
                </p>
                <p className="text-[#1B4332]/70 text-sm font-medium text-center mt-1">
                  Kontaktiraj nas:
                </p>
              </div>

              <div className="p-5 space-y-4">
                {/* Phone number */}
                <a
                  href={`tel:${CONTACT.phoneClean}`}
                  className="flex items-center justify-center gap-3 py-3 px-4 bg-[#E4EDE6] border-2 border-[#1B4332] rounded-lg shadow-[3px_3px_0px_#1B4332] hover:shadow-[4px_4px_0px_#1B4332] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                >
                  <Phone className="w-5 h-5 text-[#2D6A4F]" />
                  <span className="font-bold text-[#1B4332]">{CONTACT.phone}</span>
                </a>

                {/* Social icons */}
                <div className="flex justify-center gap-4">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${CONTACT.whatsapp.replace(/\+/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 flex items-center justify-center bg-[#25D366] border-3 border-[#1B4332] rounded-xl shadow-[3px_3px_0px_#1B4332] hover:shadow-[4px_4px_0px_#1B4332] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                    title="WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>

                  {/* Viber */}
                  <a
                    href={`viber://chat?number=${CONTACT.viber.replace(/\+/g, '%2B')}`}
                    className="w-14 h-14 flex items-center justify-center bg-[#7360F2] border-3 border-[#1B4332] rounded-xl shadow-[3px_3px_0px_#1B4332] hover:shadow-[4px_4px_0px_#1B4332] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                    title="Viber"
                  >
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                      <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.182.518 6.792.434 10.049c-.084 3.256-.19 9.365 5.752 11.091l.007.001s-.007 1.317-.007 1.771c0 0-.063.866.518 1.052.55.186.916-.348 1.468-.932.303-.32.723-.793 1.04-1.155 2.86.252 5.063-.293 5.32-.384.58-.187 3.86-.602 4.394-4.903.555-4.464-.258-7.273-1.715-8.552-.084-.093-.163-.18-.253-.27l.003-.003c-.587-.589-3.098-2.584-8.35-2.756 0 0-.415-.028-1.213-.007zm.133 1.765c.686-.013 1.055.01 1.055.01 4.357.143 6.531 1.72 7.033 2.235.075.073.141.147.216.22h.002c1.175 1.038 1.871 3.538 1.395 7.346-.427 3.487-3.054 3.8-3.537 3.955-.207.072-2.102.54-4.495.38 0 0-1.78 2.155-2.336 2.715-.09.09-.196.134-.27.12-.105-.018-.134-.123-.133-.27l.015-2.938-.001-.003c-4.818-1.397-4.538-6.582-4.473-9.16.066-2.577.633-4.713 2.041-6.096 1.95-1.713 5.507-2.18 7.377-2.316.127-.1.27-.015.406-.015-.036-.022-.036-.064-.026-.093h.001c-.1.006-.168.022-.27.028zm1.167 2.348c-.11 0-.2.09-.2.2 0 .11.09.2.2.2 1.54.014 2.88.58 3.9 1.612 1.03 1.018 1.61 2.364 1.64 3.868.001.11.09.198.2.198h.01c.11 0 .2-.09.198-.2-.032-1.62-.666-3.073-1.777-4.196-1.1-1.11-2.554-1.728-4.17-1.742-.006 0-.006.06-.002.06zm-3.5 1.15c-.156-.004-.326.013-.495.05-.556.13-.96.395-.972.405-.41.29-.74.633-.997 1.003-.256.37-.442.794-.567 1.21-.062.208-.1.414-.1.616 0 .253.055.496.16.728.16.34.367.74.617 1.189.518.94 1.192 2.038 2.06 2.946.16.17.325.34.508.516.184.176.38.352.595.528.9.762 2.024 1.385 3.054 1.885.534.256.998.454 1.376.595.233.094.477.184.73.264.253.08.52.146.804.146h.05c.206-.008.4-.05.58-.11.36-.124.69-.333.95-.605l.01-.01c.11-.12.21-.246.29-.378.08-.13.14-.27.17-.41.03-.15.04-.3.01-.45-.03-.15-.1-.29-.21-.4l-.023-.02c-.32-.298-.66-.557-.99-.788-.35-.23-.71-.43-1.04-.573-.126-.053-.31-.08-.5-.07-.188.01-.38.06-.534.18l-.64.49c-.174.14-.404.15-.59.07 0 0-.766-.34-1.567-.898-.802-.557-1.63-1.33-1.888-2.024-.04-.12-.02-.26.09-.37l.434-.48c.11-.12.17-.27.19-.42.02-.15-.003-.3-.07-.44-.16-.345-.372-.72-.6-1.09-.23-.37-.48-.73-.72-1.04-.12-.15-.27-.27-.43-.34-.16-.07-.33-.1-.5-.1h.01zm3.17.627c-.11 0-.198.09-.198.2 0 .11.088.2.198.2.96.008 1.797.37 2.457 1.016.658.647 1.043 1.51 1.057 2.455.002.11.093.198.202.198h.008c.11-.002.198-.092.197-.202-.015-1.06-.448-2.03-1.184-2.77-.73-.74-1.68-1.167-2.737-1.177v.08zm.313 1.418c-.11-.006-.204.08-.21.19-.005.11.08.204.19.21.52.034.96.25 1.29.595.32.345.51.81.51 1.325 0 .11.09.2.2.2.11 0 .2-.09.2-.2 0-.63-.23-1.2-.62-1.63-.4-.43-.94-.68-1.56-.72v.03z"/>
                    </svg>
                  </a>

                  {/* Instagram (inactive) */}
                  <div
                    className="w-14 h-14 flex items-center justify-center bg-gray-300 border-3 border-[#1B4332] rounded-xl shadow-[3px_3px_0px_#1B4332] opacity-50 cursor-default"
                    title="Instagram - uskoro"
                  >
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-gray-500" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <Link href="/login">
              <div className="bg-[#2D6A4F] border-4 border-[#1B4332] rounded-xl shadow-[6px_6px_0px_#1B4332] p-5 hover:shadow-[8px_8px_0px_#1B4332] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                <div className="flex items-center justify-center gap-3">
                  <LogIn className="w-6 h-6 text-white" />
                  <span className="text-xl font-bold text-white uppercase tracking-wide">
                    Vodi me u moj salon
                  </span>
                </div>
              </div>
            </Link>

            {/* Demo Login */}
            <div className="bg-white border-4 border-[#1B4332] rounded-xl shadow-[6px_6px_0px_#1B4332] overflow-hidden">
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDemoLogin('admin')}
                    disabled={demoLoading !== null}
                    className="h-11 text-sm font-bold border-3 border-[#1B4332] rounded-lg bg-[#E4EDE6] text-[#1B4332] shadow-[3px_3px_0px_#1B4332] hover:shadow-[4px_4px_0px_#1B4332] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_#1B4332] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {demoLoading === 'admin' ? 'Prijava...' : 'Demo Admin'}
                  </button>
                  <button
                    onClick={() => handleDemoLogin('owner')}
                    disabled={demoLoading !== null}
                    className="h-11 text-sm font-bold border-3 border-[#1B4332] rounded-lg bg-[#E76F51]/80 text-white shadow-[3px_3px_0px_#1B4332] hover:shadow-[4px_4px_0px_#1B4332] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_#1B4332] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {demoLoading === 'owner' ? 'Prijava...' : 'Demo Salon'}
                  </button>
                </div>
                {demoError && (
                  <p className="text-xs text-[#E76F51] font-bold text-center mt-2">{demoError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center relative z-10">
        <p className="text-sm font-medium text-[#1B4332]/50">
          © {new Date().getFullYear()} Dragica. Sva prava zadržana.
        </p>
      </footer>
    </div>
  )
}
