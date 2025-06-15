import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Link from 'next/link'
import { useState } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="bg-black text-white px-4 py-4 shadow-md relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <img
              src="/siteguard-logo-transparent.png"
              alt="SiteGuard Logo"
              className="w-36 sm:w-40 md:w-48"
            />
          </Link>

          {/* Hamburger Icon */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex space-x-6 text-sm uppercase font-semibold tracking-wide">
            <Link href="/" className="hover:text-cyan-400">Home</Link>
            <Link href="/technology" className="hover:text-cyan-400">Technology</Link>
            <Link href="/pricing" className="hover:text-cyan-400">Pricing</Link>
            <Link href="/faq" className="hover:text-cyan-400">FAQ</Link>
          </nav>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="sm:hidden mt-4 flex flex-col items-start space-y-4 px-4 text-sm uppercase font-semibold tracking-wide">
            <Link href="/" className="hover:text-cyan-400">Home</Link>
            <Link href="/technology" className="hover:text-cyan-400">Technology</Link>
            <Link href="/pricing" className="hover:text-cyan-400">Pricing</Link>
            <Link href="/faq" className="hover:text-cyan-400">FAQ</Link>
          </div>
        )}
      </header>

      <Component {...pageProps} />
    </>
  )
}
