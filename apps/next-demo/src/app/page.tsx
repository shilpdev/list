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
    description: 'Search, filter by category, sort, choose columns and paginate.',
  },
  {
    href: '/users',
    title: 'Users',
    description: 'Search, filter by role and gender, sort, choose columns and paginate.',
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
