"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Equal,
  X,
  ChevronDown,
  FileText,
  Map,
  GraduationCap,
  LayoutGrid,
  PanelLeft,
  Palette,
  Boxes,
  Plug,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/pro-blocks/logo"

type SubMenuItem = {
  label: string | React.ReactNode
  href: string
  icon?: React.ReactNode
  description?: string
}

type MenuItemWithSubmenu = {
  label: string
  submenu: readonly SubMenuItem[]
  href?: never // Ensure href is not present when submenu is
}

type MenuItemWithHref = {
  label: string
  href: string
  submenu?: never // Ensure submenu is not present when href is
}

type MenuItem = MenuItemWithSubmenu | MenuItemWithHref

const MENU_ITEMS: readonly MenuItem[] = [
  {
    label: "Products",
    submenu: [
      {
        label: "Components",
        href: "#",
        icon: <Boxes className="h-4 w-4" strokeWidth={2} />,
        description: "Pixel-perfect shadcn/ui components for Figma",
      },
      {
        label: "Plugin",
        href: "#",
        icon: <Plug className="h-4 w-4" strokeWidth={2} />,
        description: "Go from Figma to shadcn/ui in seconds",
      },
      {
        label: "Blocks",
        href: "#",
        icon: <LayoutGrid className="h-4 w-4" strokeWidth={2} />,
        description: "Top-quality blocks for Figma and React",
      },
      {
        label: "Templates",
        href: "#",
        icon: <PanelLeft className="h-4 w-4" strokeWidth={2} />,
        description: "Figma and React templates for shadcn/ui",
      },
      {
        label: "Themes",
        href: "#",
        icon: <Palette className="h-4 w-4" strokeWidth={2} />,
        description: "Free shadcn/ui themes for your next project",
      },
    ],
  },
  {
    label: "Resources",
    submenu: [
      {
        label: "Academy",
        href: "#",
        icon: <GraduationCap className="h-4 w-4" strokeWidth={2} />,
        description: "Learn the Figma to shadcn/ui process",
      },
      {
        label: "Blog & Updates",
        href: "#",
        icon: <FileText className="h-4 w-4" strokeWidth={2} />,
        description: "Stay up to date with the latest news",
      },
      {
        label: "Roadmap",
        href: "#",
        icon: <Map className="h-4 w-4" strokeWidth={2} />,
        description: "See what's coming next",
      },
    ],
  },
  { label: "Docs", href: "#" },
  { label: "Help", href: "#" },
  { label: "Pricing", href: "#" },
] as const

interface NavMenuItemsProps {
  className?: string
}

const NavMenuItems = ({ className }: NavMenuItemsProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const pathname = usePathname()
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const currentDropdown = dropdownRefs.current[openDropdown]
        if (
          currentDropdown &&
          !currentDropdown.contains(event.target as Node)
        ) {
          setOpenDropdown(null)
        }
      }
    }

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openDropdown])

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={`-mx-2 flex flex-col gap-1 lg:flex-row ${className ?? ""}`}>
      {MENU_ITEMS.map(({ label, href, submenu }) => (
        <div key={label} className="relative">
          {submenu ? (
            <div
              className="w-full"
              ref={(el) => {
                dropdownRefs.current[label] = el
              }}
            >
              <Button
                variant="ghost"
                className="w-full justify-between gap-1.5 px-2 font-medium lg:w-auto"
                onClick={() => toggleDropdown(label)}
              >
                {label}
                <ChevronDown
                  className={`transition-transform duration-200 ${
                    openDropdown === label ? "rotate-180" : ""
                  }`}
                />
              </Button>
              {openDropdown === label && (
                <div className="w-full animate-in rounded-[1rem] bg-background duration-200 fade-in lg:absolute lg:top-full lg:min-w-[340px] lg:border lg:border-border lg:p-2 lg:shadow-lg">
                  {/* Desktop: Two-column layout */}
                  <div className="hidden lg:flex lg:flex-col lg:gap-1">
                    {submenu.map((item: SubMenuItem, index: number) => (
                      <Link
                        key={`${
                          typeof item.label === "string" ? item.label : index
                        }`}
                        href={item.href}
                      >
                        <div
                          className={`flex items-center gap-2.5 rounded-[0.55rem] p-2 transition-colors hover:bg-accent ${
                            isActiveLink(item.href) ? "bg-accent" : ""
                          }`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.35rem] border border-border bg-card">
                            {item.icon}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {/* Mobile: Single column layout (unchanged) */}
                  <div className="lg:hidden">
                    {submenu.map((item: SubMenuItem, index: number) => (
                      <Link
                        key={`${
                          typeof item.label === "string" ? item.label : index
                        }`}
                        href={item.href}
                      >
                        <Button
                          variant="ghost"
                          className={`w-full justify-start gap-2 rounded-none px-3 py-2 font-medium ${
                            isActiveLink(item.href) ? "bg-accent" : ""
                          }`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          {item.icon}
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href={href}>
              <Button
                variant="ghost"
                className={`w-full justify-start px-3 font-medium lg:w-auto lg:px-3 ${
                  isActiveLink(href) ? "bg-accent" : ""
                }`}
                onClick={() => setOpenDropdown(null)}
              >
                {label}
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}

export function LpNavbar7() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)

  return (
    <nav className="sticky top-0 isolate z-50 border-border bg-background">
      <div className="container-padding-x mx-auto max-w-7xl">
        <div className="relative flex flex-col justify-between py-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex w-full items-center justify-between">
            <Link href="/" aria-label="Go to homepage">
              <Logo className="size-7" />
            </Link>
            <Button
              variant="ghost"
              className="flex size-9 items-center justify-center rounded-full border border-border lg:hidden"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X /> : <Equal />}
            </Button>
          </div>

          {/* Desktop Navigation */}
          <div className="absolute left-[50%] hidden -translate-x-1/2 flex-row gap-5 lg:flex">
            <NavMenuItems />
          </div>
          <div className="flex flex-row gap-2">
            <Link href="#" aria-label="Preview all our resources">
              <Button variant="outline" className="hidden lg:flex">
                Preview
              </Button>
            </Link>
            <Link href="#" aria-label="View our pricing">
              <Button className="hidden lg:flex">Buy now</Button>
            </Link>
          </div>
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="mt-4 flex w-full flex-col justify-end gap-5 pb-2.5 lg:hidden">
              <NavMenuItems />
              <div className="flex flex-col gap-2">
                <Link href="#" aria-label="Preview all our resources">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full px-4 shadow-none lg:flex"
                  >
                    Preview
                  </Button>
                </Link>
                <Link href="#" aria-label="View our pricing">
                  <Button size="lg" className="w-full shadow-none">
                    Buy now
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
