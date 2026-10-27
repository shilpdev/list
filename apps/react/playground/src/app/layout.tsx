import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'React-List Playground',
  description: 'Manual testing playground for @shilp.dev/react-list',
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/users', label: 'Users' },
]

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-muted/40">
        <header className="border-b bg-background">
          <nav className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3">
            <span className="mr-4 font-semibold">React-List Playground</span>
            {NAV_LINKS.map((link) => {
              return (
                <Button
                  key={link.href}
                  variant="ghost"
                  nativeButton={false}
                  render={<Link href={link.href} />}
                >
                  {link.label}
                </Button>
              )
            })}
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6">{children}</main>
      </body>
    </html>
  )
}
