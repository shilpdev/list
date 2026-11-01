---
name: pro-blocks-create
description: "Create custom section blocks (and small shared sub-components) that are indistinguishable from official shadcndesign.com Pro Blocks: same structure, tokens, utility classes, and conventions. Use when the user needs a section no Pro Block covers, or asks to build a custom block/section \"matching Pro Blocks\" in a Next.js project that uses them."
---

# Create a custom Pro Block

Write a section that could ship in the official registry: a reviewer diffing it against a real Pro Block should find no convention it breaks. Custom blocks exist because the catalog lacks the section, never as an excuse to leave the system; before writing one, confirm via search (`npx shadcn@latest search @shadcndesign -q "<topic>"`) that no official block covers the need. Customizing an installed block (pro-blocks-page) beats writing a new one.

Next.js-only, in a project with Pro Blocks set up (`@shadcndesign/styles` installed; the utility classes below come from it).

## Step 1: Read two siblings first (mandatory)

Read two installed official blocks from the **same category** as the section you're about to write (`components/pro-blocks/<main>/<category>/`; none installed → install one cheap variant to read). The conventions below are the invariants, but the siblings carry the current idiom: exact spacing choices, how this category structures its data arrays, which sub-components it reaches for. Where this document and freshly-installed siblings disagree, the siblings win: they're the shipping product.

## Step 2: Placement and naming

- File: `components/pro-blocks/custom/<category>/<kebab-name>.tsx`, mirroring the official folder scheme (`landing-page`/`application`/`e-commerce` category names) so custom and official read identically. Shared atoms a block needs (a custom card, a badge) get their own file beside it, like the official `product-card-*` siblings.
- Export: one named function, PascalCase of the file name. Props only for genuinely variable content (the official pattern: mostly zero props, content inline or in local constants).

## Step 3: Start from an empty-section scaffold

The catalog ships its own starting points: `empty-lp-section-1…4` are official blocks that are nothing BUT the correct skeleton, with a dashed placeholder div where content goes. Starting from one guarantees the invariants instead of retyping them:

```bash
npx shadcn@latest add @shadcndesign/empty-lp-section-2
```

Install, copy into `components/pro-blocks/custom/<category>/` (the base stays pristine, as everywhere), rename file + export, then replace the dashed `Replace this div with your content` div with the content area.

Pick the scaffold by the section's anatomy:

```
What header does the section need?
├── No header (full-custom layout, full-bleed art, custom hero)
│   → empty-lp-section-1  (bare: section + container + content slot)
├── Centered header (symmetric content: logo walls, stats, pricing,
│   testimonial grids, galleries)
│   → empty-lp-section-2  (centered title group, max-w-xl, mx-auto)
├── Left-aligned header (editorial/asymmetric: features, blog lists, FAQs)
│   → empty-lp-section-3  (left title group, max-w-xl)
└── Split header (heading left, intro paragraph right; wide showcases)
    → empty-lp-section-4  (heading and intro as side-by-side flex-1 at lg:)
```

And fill the content slot with one of the recurring content-area patterns from the catalog:

- **Card grid**: `grid gap-4 md:grid-cols-2 lg:grid-cols-3` of one repeated card component (official sections vary columns 2–4 by density).
- **Split media**: `flex flex-col gap-12 lg:flex-row lg:gap-16` with two `flex-1` halves: content column one side, `AspectRatio` + `next/image` the other.
- **Centered stack**: single `max-w-xl`/`max-w-3xl` column for forms, FAQs (accordion), rich text.
- **Logo/stat row**: `flex flex-wrap items-center justify-center gap-*` or an even grid of small items.

Note: the *application* category also has `empty-sections`. Those are empty-**state** UI blocks ("no databases yet" panels), not scaffolds; don't confuse the two. For custom application/e-commerce sections there's no scaffold block. Take the skeleton from your two read siblings (Step 1) instead.

## The invariants (what the scaffold is made of)

Whether scaffolded or hand-built, every section block has this shape; it's what makes blocks compose on a page:

```tsx
"use client";

export function CustomLogoWall() {
  return (
    <section
      className="bg-background section-padding-y"
      aria-labelledby="logo-wall-heading"
    >
      <div className="container-padding-x mx-auto max-w-7xl">
        <div className="section-title-gap-lg flex flex-col items-center text-center">
          <Tagline>Partners</Tagline>
          <h2 id="logo-wall-heading" className="heading-lg">…</h2>
          <p className="text-muted-foreground">…</p>
        </div>
        {/* content */}
      </div>
    </section>
  );
}
```

The load-bearing parts, and why they're invariant:

- **`section-padding-y` on the section, `container-padding-x mx-auto max-w-7xl` on the container.** These utilities are the page rhythm: every official block uses them, so pages stack blocks with uniform spacing, and `pro-blocks-brand` can retune density site-wide. A block with its own `py-24` breaks both.
- **`heading-xl…sm` on headings, never manual font classes.** The heading utilities carry the theme's display type (size, weight, tracking, responsive scale). `heading-xl` is for heroes; interior sections use `lg`/`md`.
- **Title groups wrap in `section-title-gap-{sm|md|lg|xl}`** (tagline + heading + subtext), sized to the heading size used.
- **`aria-labelledby` on the section pointing at the heading's `id`.** Every official block is a labeled landmark; match it.
- **Semantic tokens only**: `bg-background`, `bg-card`, `text-muted-foreground`, `border`, `text-primary`… A raw hex or Tailwind palette color (`text-zinc-500`) freezes the block out of re-theming; the one exception the catalog itself makes is true decoration (e.g. a green "live" dot).
- **Mobile-first, `lg:` as the primary breakpoint**: stack by default, expand at `lg:` (`flex-col lg:flex-row`, `gap-12 lg:gap-16`), centered text on mobile, left-aligned at `lg:` where siblings do.
- **`"use client"`** at the top. Blocks are client components in the official catalog.

## Step 4: Content and pieces

- **Reuse before writing**: `Tagline` (variants: `default`, `secondary`, `ghost`, `white`, `link`) for eyebrows; the `product-card-*` / `product-category-card-*` family in e-commerce; `components/ui/*` primitives for everything interactive. A custom atom is a last resort, built token-pure like Step 3.
- **Repeating content lives in typed local constants** rendered with `.map()`; that's how official blocks make counts editable in one place.
- **Icons**: `lucide-react` only.
- **Images**: `next/image` inside `AspectRatio` (or `fill` with a sized parent), `src="https://ui.shadcn.com/placeholder.svg"` as the placeholder, meaningful `alt`.
- **Demo copy** in the official register: instructional placeholder text ("Follow with one or two sentences that expand on your value proposition") rather than fake company lorem.

## Step 5: Verify like a reviewer

1. Render the block on a page between two official blocks at mobile and desktop widths; it should be impossible to tell which is the custom one (spacing rhythm, heading scale, alignment behavior).
2. Toggle dark mode: token-pure blocks just work; anything that doesn't is a hardcoded color.
3. Grep your file for the failure classes: raw hex, Tailwind palette colors beyond true decoration, `py-`/`px-` on the section or container where the utilities belong, manual `text-4xl font-bold` headings.
4. `next build` passes.
