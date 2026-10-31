'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/pro-blocks/logo'

const MENU_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Users', href: '/users' },
] as const

const GITHUB_URL = 'https://github.com/shilpdev/list'
const DOCS_URL = 'https://7span.com/open-source/react-list/'
const NPM_URL = 'https://www.npmjs.com/package/@shilp.dev/react-list'

function NavMenuItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="-mx-2 flex flex-col gap-1 lg:flex-row">
      {MENU_ITEMS.map(({ label, href }) => {
        return (
          <Link key={href} href={href} onClick={onNavigate}>
            <Button
              variant="ghost"
              className={`w-full justify-start px-3 font-medium lg:w-auto ${
                isActiveLink(href) ? 'bg-accent' : ''
              }`}
            >
              {label}
            </Button>
          </Link>
        )
      })}
    </div>
  )
}

function NavActions({ className }: { className?: string }) {
  return (
    <div className={className}>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
        <Button variant="outline" className="w-full lg:w-auto">
          <Icon icon="mdi:github" />
          GitHub
        </Button>
      </a>
      <a href={DOCS_URL} target="_blank" rel="noreferrer" aria-label="Docs">
        <Button className="w-full lg:w-auto">
          <Icon icon="mdi:book-open-page-variant-outline" />
          Docs
        </Button>
      </a>
      <a href={NPM_URL} target="_blank" rel="noreferrer" aria-label="npm">
        <Button variant="outline" className="w-full lg:w-auto">
          <Icon icon="mdi:npm" />
          <span className="lg:sr-only">npm</span>
        </Button>
      </a>
    </div>
  )
}

export function SharedNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 isolate z-50 border-b border-border bg-background">
      <div className="container-padding-x mx-auto max-w-7xl">
        <div className="relative flex flex-col justify-between py-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex w-full items-center justify-between">
            <Link href="/" aria-label="Go to homepage" className="flex items-center gap-2">
              <Logo className="size-7" />
              <span className="font-semibold">Shilp List - React Demo</span>
            </Link>
            <Button
              variant="ghost"
              className="flex size-9 items-center justify-center rounded-full border border-border lg:hidden"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <Icon icon="mdi:close" /> : <Icon icon="mdi:menu" />}
            </Button>
          </div>

          <div className="absolute left-[50%] hidden -translate-x-1/2 lg:flex">
            <NavMenuItems />
          </div>
          <NavActions className="hidden flex-row gap-2 lg:flex" />

          {isMenuOpen && (
            <div className="mt-4 flex w-full flex-col gap-5 pb-2.5 lg:hidden">
              <NavMenuItems onNavigate={() => setIsMenuOpen(false)} />
              <NavActions className="flex flex-col gap-2" />
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
