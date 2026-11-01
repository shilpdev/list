---
name: pro-blocks-select
description: "Choose the right shadcndesign.com Pro Blocks for a page or section: category map, page recipes, pairing rules, and how to search the live registry. Use whenever picking blocks from the @shadcndesign registry: composing a page, replacing a section, or answering \"which block should I use for X\". The pro-blocks-page skill consults this before installing anything."
---

# Selecting Pro Blocks

Pick blocks by walking this order: **page type → recipe → category → live search within the category**. The registry has ~390 blocks; the recipes and pairing rules here are the product's own opinion (derived from its shipped example pages), and the live registry is the source of block-level truth. Never recite block numbers from memory, search for them.

## Searching the live registry

```bash
npx shadcn@latest search @shadcndesign -q "hero"          # find blocks by keyword
npx shadcn@latest view @shadcndesign/hero-section-1       # inspect one before installing
```

(Same via the shadcn MCP tools if available: search/view items in the `@shadcndesign` registry.) Search returns names, titles, and descriptions; the descriptions say what each variant looks like and which sub-components it uses. Query by the category words below plus layout intent ("split image", "carousel", "grid", "centered"). Blocks are named `<category-singular>-<n>` (`hero-section-11`, `pricing-section-2`, `app-shell-3`).

## Category map

- **Landing page**: `lp-navbars`, `hero-sections`, `logo-sections`, `feature-sections`, `bento-grids`, `stats-sections`, `testimonials-sections`, `pricing-sections`, `comparison-sections`, `faq-sections`, `blog-sections`, `team-sections`, `gallery-sections`, `contact-sections`, `cta-sections`, `banners`, `rich-text-sections`, `header-sections` (interior-page headers), `patterns` (decorative backgrounds), `404-sections`, `footers`.
- **Application**: `app-shells` (sidebar/topbar chrome), `navbars`, `page-headers`, `section-headers` / `section-footers`, `sections`, `cards`, `buttons` (micro-patterns: steppers, like-counts), `description-lists`, `table-headers`, `settings`, `sign-in`, `sign-up`, `empty-sections` (empty-state panels: "no data yet" screens).
- **Scaffolds**: `empty-lp-sections` are blank section skeletons for building custom sections; they belong to the pro-blocks-create workflow, not to page composition; never place one on a finished page.
- **E-commerce**: `store-navbars`, `product-list-sections`, `product-list-filters`, `product-category-sections`, `product-headers` (product detail), `shopping-carts`, `checkouts`, `order-summary-sections`, `sale-sections`, `incentives`, plus shared `product-card-*` / `product-category-card-*` / `product-image-carousel-*` components.

## Page recipes

Ordered section lists per page type. Sections marked `?` are optional. Include them when the user's brief gives them content, skip otherwise; an empty section is worse than no section.

- **SaaS/product landing page** (mirrors the shipped `landing-page-1` example): `lp-navbar → hero → logo-section? → feature-section ×1–3 → testimonials → stats? → pricing? → comparison? → faq? → blog? → cta → footer`.
- **Interior marketing page** (about, blog index, contact): `lp-navbar → header-section → content sections (team / rich-text / gallery / blog / contact) → cta? → footer`.
- **Storefront home** (mirrors the `storefront` example): `store-navbar → hero → product-list-section ×1–2 → product-category-section → sale-section? → incentives? → cta? → footer`.
- **Category page**: `store-navbar → product-list-filters (wraps the product grid) → cta? → incentives? → footer`.
- **Product page**: `store-navbar → product-header → product-list-section (related)? → cta? → incentives? → footer`.
- **Cart / checkout / order**: `store-navbar → shopping-cart | checkout | order-summary-section → footer`.
- **App screen**: `app-shell` (once, wraps everything) → `page-header → sections / cards / description-lists / table-headers` per screen; `settings-*` for settings screens; `sign-in`/`sign-up` stand alone without the shell.

## Pairing rules

- **One chrome family per site.** Pick the navbar and footer once and reuse the same ones on every page; mixed navbars read as different websites. E-commerce sites use `store-navbars`, marketing sites `lp-navbars`; don't mix.
- **One hero-weight section per page.** Heroes, banner-style CTAs, and full-bleed sale sections compete; a page gets one at the top, and the closing CTA uses a lighter `cta-sections` variant.
- **Reuse the same card within a page.** When several sections show products or categories, keep them on the same `product-card-*` / `product-category-card-*`. The descriptions name which card a section uses; matching cards is what makes pages look designed.
- **Vary section rhythm.** Adjacent sections shouldn't share the same layout skeleton (two centered-text sections, two identical grids). Alternate alignment and density; the block descriptions state the layout, so check before stacking.
- **Match variant tone across the page.** Blocks come in minimal and rich variants; a minimal hero followed by the busiest testimonial wall clashes. Pick one register and stay in it.

## Procedure

1. Identify the page type (or single-section ask) from the brief; choose the recipe.
2. For each recipe slot, search the category live and shortlist 1–3 variants whose description matches the brief's content (has testimonials with logos? needs a carousel? image left or right?).
3. Apply the pairing rules across the shortlist; they veto individually-good blocks that clash as a set.
4. Return the chosen list in page order with one line of why per block, and note content the brief lacks (e.g. "pricing tiers needed; skipped pricing section").
