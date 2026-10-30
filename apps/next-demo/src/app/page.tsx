import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const PAGES = [
  {
    href: '/products',
    title: 'Products',
    description: 'dummyjson products with search, category filter, sorting and pagination.',
  },
  {
    href: '/users',
    title: 'Users',
    description: 'dummyjson users through the same list wrapper, filtered by role.',
  },
]

export default function Home() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {PAGES.map((page) => {
        return (
          <Card key={page.href}>
            <CardHeader>
              <CardTitle>{page.title}</CardTitle>
              <CardDescription>{page.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button nativeButton={false} render={<Link href={page.href} />}>
                Open {page.title}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
