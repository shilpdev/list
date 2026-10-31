import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const taglineVariants = cva(
  "flex w-fit items-center justify-center gap-1 text-sm font-medium [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "h-7 rounded-md border bg-background px-2.5 shadow-xs",
        secondary:
          "h-7 rounded-md bg-secondary px-2.5 text-secondary-foreground",
        ghost: "bg-transparent text-muted-foreground capitalize",
        white: "text-white",
        link: "h-7 cursor-pointer gap-1.5 rounded-full border bg-card px-3 py-0 shadow-xs transition-colors hover:bg-accent [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "ghost" },
  }
)

type TaglineProps = useRender.ComponentProps<"div"> &
  VariantProps<typeof taglineVariants>

function Tagline({ className, variant, render, ...props }: TaglineProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        "data-slot": "tagline",
        className: cn(taglineVariants({ variant, className })),
      } as React.ComponentProps<"div">,
      props
    ),
  })
}

export { Tagline, taglineVariants }
