'use client'

import dynamic from 'next/dynamic'

import { Skeleton } from '@/components/ui/skeleton'

// The list reads the URL and localStorage while it sets up, so it only renders in the browser.
// Rendering it on the server would produce markup that does not match the first client render.
export const ClientListWrapper = dynamic(
  () => {
    return import('@/components/list-wrapper').then((module) => {
      return module.ListWrapper
    })
  },
  {
    ssr: false,
    loading: () => {
      return <Skeleton className="h-96 w-full rounded-xl" />
    },
  },
)
