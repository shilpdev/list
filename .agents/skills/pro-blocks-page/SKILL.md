---
name: pro-blocks-page
description: "Build full pages (landing pages, storefronts, app screens) in a Next.js project from shadcndesign.com Pro Blocks: select, install, copy, customize, assemble. Use when the user asks to build, create, or assemble a page or site and the project has the @shadcndesign registry configured (or mentions Pro Blocks). For picking which blocks, this consults pro-blocks-select."
---

# Build pages from Pro Blocks

Assemble pages by **installing official blocks and customizing renamed copies**, never by writing sections from scratch (the registry almost certainly has the section, and scratch sections break the design system) and never by editing the installed originals. Next.js-only; no `@shadcndesign` registry in `components.json` → run/suggest `pro-blocks-setup` first.

## The copy rule

Installed files under `components/pro-blocks/**` are pristine bases. Every use on a page gets a **renamed copy** that you customize; the base is never edited. This is how the product's own examples are built (`lp-1-hero-section-11.tsx` is a copy of `hero-section-11`), and it's what the rule protects: the same block reused on two pages with different content, and re-installs that never clobber customizations.

- Copies live with the page that owns them: `app/<route>/components/` (or the project's obvious equivalent; match what exists).
- Name copies for their role, keep the export PascalCase: `acme-hero.tsx` → `AcmeHero`.
- **Chrome is shared, not per-page**: the navbar, footer, and any recurring CTA get ONE copy each in a `components/shared/` folder (the kit's e-commerce examples do exactly this), imported by every page. Two navbar copies will drift into two different navbars.

## Workflow

### 1. Scope the page

From the brief: page type, sections, and the content the user actually supplied (product name, copy, pricing tiers, testimonials, images). Consult **pro-blocks-select** (recipes + pairing rules + live search) to produce the block list in page order. Present it with one-line rationales and confirm with the user before installing. Swapping a block later costs a re-copy, so the list is the cheap moment to disagree.

### 2. Install

```bash
npx shadcn@latest add @shadcndesign/<name-1> @shadcndesign/<name-2> ...
```

One command, all chosen blocks; dependencies (tagline, cards, ui primitives) come along automatically. Auth errors → `pro-blocks-setup`'s symptom table.

### 3. Copy and customize

For each block, copy → rename file and export → then edit only the copy:

- **Text**: replace every placeholder heading, body line, label, and stat with content from the brief. No content for a line → write plausible copy in the brand's voice and flag it in the report; never ship "Solve your user's main problem".
- **Structure**: the repeating parts (features, tiers, testimonials, products) are arrays or repeated JSX; match the count to the real content. Three real features means three cards, not four with one faked.
- **Images**: user-provided assets go to `public/` and into the existing `next/image` slots (keep the `AspectRatio`/`fill`/`priority` wiring the block already has). No assets → keep the block's `https://ui.shadcn.com/placeholder.svg` placeholders and list every one in the report as a swap point.
- **Links**: wire real routes into navbars, footers, and CTAs; a CTA pointing at `#` is a defect, not a placeholder.
- **Never**: change the block's tokens, utility classes (`section-padding-y`, `heading-*`, …), or responsive skeleton. Styling belongs to the theme (`pro-blocks-brand`), not to per-page edits; a page that overrides tokens stops re-theming.

### 4. Assemble

The page component renders the copies in recipe order: chrome from `components/shared/`, sections in sequence, nothing else between them (blocks own their spacing via `section-padding-y`; wrapper divs with margins break the rhythm):

```tsx
export default function Page() {
  return (
    <>
      <SharedNavbar />
      <AcmeHero />
      <AcmeFeatures />
      <AcmeCta />
      <SharedFooter />
    </>
  );
}
```

### 5. Verify

1. `next build` (or the project's build script) passes: imports, types, client/server boundaries.
2. Render the page and look at it (dev server + browser/screenshot when available) at mobile and desktop widths: no unstyled headings (missing `@shadcndesign/styles`), no placeholder text that had real content, chrome identical across pages.
3. Check dark mode if the project has a theme toggle. Blocks are token-driven and should just work; anything broken means a hardcoded color crept into a copy.
4. Report: pages built, blocks used (base → copy names), placeholders left, copy invented, links wired.
