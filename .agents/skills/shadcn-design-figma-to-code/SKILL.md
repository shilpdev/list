---
name: shadcn-design-figma-to-code
description: Convert a Figma selection built with the shadcn/ui kit for Figma (shadcndesign.com) into production shadcn/ui code for the project's stack. Use when the user pastes a figma.com URL, selects a frame in the Figma desktop app, or asks to convert a design to code, implement a Figma screen, or "Figma to code", in any React-based project (Next.js, Astro, Vite, Remix, TanStack).
argument-hint: "[figma-node-url]"
---

# Figma → shadcn/ui code

Convert a frame built with the shadcn/ui kit for Figma into code that uses the project's **existing** shadcn/ui components and semantic tokens. The kit's layer names, variable names, and component names map 1:1 onto shadcn/ui code; the skill's job is to follow those mappings instead of transcribing pixels, because transcription produces one-off styles that fall out of the project's theme.

## Step 1: Inputs

- **URL in `$ARGUMENTS`** (`figma.com/design/...`): `fileKey` = segment after `/design/`; `nodeId` = `node-id` param with `-` → `:` (`23022-103799` → `23022:103799`). Branch URLs use the `branchKey` as `fileKey`.
- **No URL**: use the current Figma desktop selection (`fileKey` and `nodeId` = `""`). If that fails, ask for a selection or URL.

## Step 2: Detect the stack

Read `package.json` and `components.json` once, up front; every later step adapts to what's found here:

| Found | Conventions to apply |
|---|---|
| `next` | `next/image`, `next/font`, `"use client"` only where interactivity requires it |
| `astro` | shadcn components are React islands; interactive ones need `client:load`/`client:visible` in `.astro` files; plain `<img>` unless an image integration exists |
| `vite` / `react-router` / `remix` / `@tanstack/*` | plain `<img>`, framework's own routing/links |
| None of these, or no React | Stop: tell the user this skill targets React-based shadcn/ui projects, and which stacks it supports |

From `components.json` also take: import aliases, the icon library (`iconLibrary`), and configured registries.

## Step 3: Fetch design context

0. **Load the Figma MCP's `figma-design-to-code` guidance before the first `get_design_context` call** (the `/figma-design-to-code` skill, or the `skill://figma/figma-design-to-code/SKILL.md` resource); the server mandates it, and it carries the gate protocol and asset-fidelity rules this skill builds on.
1. **`get_metadata` first, always.** Full pages exceed the ~25k-token output limit and get *silently* truncated; the metadata tree tells you whether the node is one section or a multi-section page.
2. One section → a single `get_design_context` call. Multi-section page → fetch each child frame individually, plus one `get_screenshot` of the whole page for overall context. Any response containing `[OUTPUT TRUNCATED` → re-fetch that node's children individually.
3. Set `clientFrameworks`/`clientLanguages` from Step 2. Treat the returned React+Tailwind as a **structural reference only**: it carries Figma artifacts (asset URLs, `data-node-id`, odd wrappers) that must never reach the final code. The screenshot is the source of truth for how things look.

### Reading the kit's design context

- **Variables arrive CSS-native.** The kit surfaces tokens as `var(--primary)`, `calc(var(--spacing) * 4)`, `var(--radius-lg)`: map them straight to Tailwind semantic classes (`bg-primary`, `p-4`, `rounded-lg`). A bare percentage (`50%`) on a color is one of the kit's alpha tokens → the `/50` opacity modifier. In kit 3.0 the `custom/*` tokens are a base token at a percentage in Figma (`custom/primary-muted` = `primary` at 5%); emit the utility recipe written in the token's Figma description (`bg-primary/5`), never the flattened color the tint resolves to. A `var(--component/…)` reference (`component/input/border`, `component/badge/px`) is a kit-internal token that only exists in Figma; it marks "this subtree is a kit component": render the mapped shadcn component and let its own styles win; never transcribe component/* values into classes. Never emit raw `var()` or hex.
- **Component instances carry their identity** in layer names (`Button`, `Field`, `Item`, `Empty`, `Kbd`, `Input Group`, `Button Group`, `Native Select`, `Spinner`, …) and variant strings (`Variant=outline, State=Default, Size=sm`): variant maps to the shadcn prop (`variant="outline" size="sm"`); `State` is interaction state, never a prop.
- **Typography**: text style names like `text-sm/leading-normal/medium` → `text-sm font-medium`; `typeset/*` styles mark long-form content → semantic HTML (`h1`–`h6`, `p`, `blockquote`) with the project's typography classes.

## Step 4: Pro Blocks, registry first

If the root (or a section) is named `Pro Blocks / <Category> / <n>.`, the intended implementation already exists in the `@shadcndesign` registry; installing it beats regenerating it.

1. Registry name: kebab-case category + number → `Pro Blocks / Hero Section / 5.` → `@shadcndesign/hero-section-5`. Verify via the shadcn MCP/CLI search; not found → fall through to Step 5.
2. Locate `components/pro-blocks/**/<block-name>.tsx`; missing → install via the registry, then read the installed file.
3. **Never edit the base block**: blocks are reused across pages. Copy it under a name derived from the design's context, then diff the copy element-by-element against the Figma reference: text, structure, swapped components/variants, layout (keep section paddings like `section-padding-y` from the root), backgrounds (a 90%-white-over-primary blend is `bg-primary/10`, not `bg-muted`), colors, spacing. When a background changes, cascade `<background>-foreground` tokens through the children.
4. Then continue at Step 6 (icons/assets) and Step 8 (verify).

### Breakpoints

Kit Pro Blocks are component sets with `Breakpoint = Desktop | Mobile` (1440 / 360). When both variants exist for the selection, fetch **both** and emit **one** responsive component, mobile-first: the Mobile variant is the base, Desktop differences go behind `lg:` prefixes. Never generate separate Desktop/Mobile components.

## Step 5: Map components and build

1. Inventory `components/ui/**` and read `app/globals.css` for the theme. A kit component with no local counterpart → install it from the shadcn registry (never hand-write a shadcn primitive that the CLI ships).
2. **Read each component's source before using it**: props and composition in the user's project may differ from upstream shadcn.
3. Kit names map to `@/components/ui/*` almost 1:1; compound kit components map to composition patterns: `Field` → `Field`/`FieldLabel`/`FieldDescription`, `Input Group` → input + addons, `Item` → the `Item` family, `Empty` → `Empty` + media/title/description slots.
4. Structure the file: imports → types → data constants → helpers → main component (default export, `className?: string` prop). Repeating rows/cards become typed constants rendered with `.map()`. Semantic tokens only; `gap-*` over margins; responsive per the Breakpoint rule above.
5. If kit token values visibly differ from the project's components (padding, radius, size), ask: apply inline via `className` (default), or edit the `components/ui` source.

## Step 6: Icons

1. Kit icon layers are named `<Library> Icon / <name>` (Lucide, Tabler, HugeIcon, Phosphor, Remix) inside IconPlaceholder wrappers: the layer name is the icon's identity; the `<img>` in the reference code is not.
2. Import from the **project's** icon library (`components.json`), converting the name to its convention (Lucide: PascalCase). Cross-library: find the same-named icon; verify every import actually exists (`node -e "console.log(!!require('lucide-react').IconName)"`). Missing → install the design's source library and import from it; last resort, inline the SVG as a component matching the library's conventions (`viewBox="0 0 24 24"`, `stroke="currentColor"`).
3. Never ship a Figma asset URL as an icon.

## Step 7: Images and assets

Figma asset URLs expire in 7 days; they never appear in final code. Ask the user once: download real assets into `public/` (then reference with the stack's image component), placeholder paths, or skip with div placeholders. Avatars in sample content: prefer `AvatarFallback` initials over downloading stock photos.

## Step 8: Verify

1. All imports resolve; every icon import verified to exist.
2. Zero Figma artifacts: no asset URLs, `data-node-id`, raw `var()`, or hex colors.
3. Semantic tokens throughout; non-default section backgrounds have contrast-cascaded children.
4. One responsive component per design: check the Mobile variant's layout is the base and Desktop appears at `lg:`.
5. Forms are semantic (`<form>`, labels wired to inputs).
6. Element-by-element pass against the screenshot: if it looks different, it **is** different: fix or explicitly report the deviation.
7. Astro projects: interactive components carry a `client:*` directive; server-only trees don't.
