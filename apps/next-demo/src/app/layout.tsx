import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SharedNavbar } from '@/components/shared/shared-navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shilp List',
  description: 'Manual testing playground for @shilp.dev/react-list',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* App Router root layout: the pages-router rule below does not apply. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400..700&family=Google+Sans+Code:wght@400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col bg-muted/40">
        <SharedNavbar />

        <main className="container-padding-x mx-auto flex w-full max-w-7xl flex-1 flex-col py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
