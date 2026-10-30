import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { BookOpenIcon } from 'lucide-react'

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
  title: 'Shilp List',
  description: 'Manual testing playground for @shilp.dev/react-list',
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/users', label: 'Users' },
]

// lucide-react no longer ships GitHub/npm brand marks (the nuxt-demo gets them from simple-icons),
// so the brand icons are inline SVGs to match without adding a dependency.
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.595 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function NpmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  )
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-muted/40">
        <header className="border-b bg-background">
          <nav className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3">
            <span className="mr-4 font-semibold">Shilp List Demo</span>
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

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                nativeButton={false}
                render={
                  <a href="https://github.com/shilpdev/list" target="_blank" rel="noreferrer" />
                }
              >
                <GithubIcon />
                GitHub
              </Button>
              <Button
                variant="ghost"
                nativeButton={false}
                render={
                  <a
                    href="https://7span.com/open-source/react-list/"
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <BookOpenIcon />
                Docs
              </Button>
            </div>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6">{children}</main>

        <footer className="border-t bg-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
            <p className="max-w-3xl text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">@shilp.dev/react-list</strong> -
              headless list component for React and Next: fetch, paginate, search, filter and show
              or hide columns. You own the UI.
            </p>
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              aria-label="npm"
              render={
                <a
                  href="https://www.npmjs.com/package/@shilp.dev/react-list"
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <NpmIcon />
            </Button>
          </div>
        </footer>
      </body>
    </html>
  )
}
