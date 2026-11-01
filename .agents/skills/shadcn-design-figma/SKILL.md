---
name: shadcn-design-figma
description: Design screens, pages, flows, and UI sections in a Figma file built on the shadcn/ui kit for Figma (shadcndesign.com). Use whenever the user asks to design, mock up, or build any UI in a kit file, even if they don't mention the kit. Identify the kit by its Tailwind, Style, Mode, and Typeset variable collections, not by mode names; customers rename or delete modes.
---

# Designing with the shadcn/ui kit for Figma

Assemble, don't invent. A design is instances of kit components, blocks, and icons, wired to kit variables and text styles. Anything hardcoded breaks the moment the user switches style or light/dark mode. Never create master components.

## Discover first

Customer kits are customized (modes renamed or deleted, components added, single icon library). Inspect the file before designing:

1. **Variables**: four collections. `Tailwind` (primitives: `spacing/*`, `rounded/*`, `colors/*`, the Tailwind v4 palette since kit 3.0), `Style` (the style modes; `radius/*`, `font/*`, `component/*`, `pro-blocks/*`, plus `meta/version`, `3.0` for the September 2026 kit), `Mode` (`Light`/`Dark` semantic colors), `Typeset` (base font sizes). Design in the mode the file already uses; don't switch it.
2. **Components**: one page per component, each with a `Components` section holding the set. Pro Blocks live on the `Pro Blocks (...)` pages as `Pro Blocks / <Category> / <n>.` sets with a `Breakpoint = Desktop | Mobile` axis.
3. **Text styles**: `text-<size>/<leading>/<weight>`, `typeset/*` for long-form, `pro-blocks/heading-*` for marketing headings.
4. **Check the inventory before re-discovering**: [references/kit-inventory.md](references/kit-inventory.md) lists the kit's component set IDs, property keys, collection IDs, and icon swap props. Verify one entry (fetch the Button set by ID) and, if it matches, use the inventory instead of walking component pages; live discovery of a known kit costs 5+ round trips for data that is already written down. If the entry fails, discover live and update the inventory.

## Script helpers

Before the first `use_figma` call, read [scripts/helpers.js](scripts/helpers.js) and prepend it verbatim to every call that creates content. It provides `V()` (variable lookup), `boundPaint()` (Mode-bound solid), `mkText()` (styled text with both font loads), and `setIcon()` (IconPlaceholder swap, with the indexing rule for mixed left/right icons in its comments). Rewriting helpers ad hoc per call is how font-load crashes and unbound fills creep in; one canonical block keeps every script identical where it must be identical.

## Plugin API gotchas in this kit

- **Auto-layout sometimes skips the layout pass.** Instances appended to a freshly created auto-layout frame can stay overlapped at `x=0` even though `layoutMode` and `layoutPositioning` read correctly, and screenshots show the same broken geometry. After populating a container, read the children's `x`; if two children report the same `x` in a horizontal stack (or `y=0` mid-stack in a vertical one), force a relayout by re-appending the children in order or toggling `itemSpacing` up by 1 and back. Cheap insurance: end each build script by re-setting the container's `itemSpacing` to its intended value.
- **Nested-instance references go stale.** Calling `setProperties` on one nested instance inside another instance regenerates its siblings' node IDs. A cached `findAll` list then throws "Node not found" and, because scripts are atomic, aborts everything the script did. When mutating several nested instances in the same component (slot contents, tab triggers), re-run the `findAll` between every mutation.
- **Button's default Size is `xs`, not `default`.** Always set Variant, Size, and State together on every Button instance; relying on any default produces a mis-sized button that looks plausible enough to survive review.

## Standard recipes

- **Section card** (bordered settings box with a muted header strip and full-bleed row dividers, the GitHub-settings shape): the Card component cannot express this, so build it from frames with one fixed recipe so every settings page comes out identical. Container: auto-layout, `card` fill, `border` stroke at 1 inside, all four radii bound to `radius/lg`, `clipsContent: true`. Header row: `muted` fill, `border` bottom stroke only, padding `spacing/4` x and `spacing/3` y, title in `text-sm/leading-normal/semibold`. Rows: transparent fill, padding `spacing/4`, gap `spacing/2`; Separator instances between rows at `FILL` width.
- **Inline links** in body text stay inside the same text node; a separate text node breaks wrapping. Apply to the link's character range: `setRangeTextDecoration(start, end, 'UNDERLINE')` and `setRangeFills(start, end, [boundPaint('primary')])`. Links are `primary` because that is the kit's action role; a hardcoded blue dies on style switch.
- **Media surfaces** (video frames, image areas) use the Aspect Ratio component, never a gray rectangle. Its placeholder art is a baked image, so it stays light in dark mode by design; do not flag it during the dark check and do not try to rebind it.

## Choosing what to place

```
Full page section (hero, pricing, navbar, sign-in)?
├── Yes → matching Pro Block exists? → ASK the user:
│   1. Instance the block, override text/props (fast, stays linked)
│   2. Build from scratch per the rules below, block as reference
│   It's their ownership/flexibility tradeoff, not yours.
│   No matching block → compose from scratch, no need to ask.
└── No
    ├── Kit component exists → instance it, set variants/props
    └── Nothing fits → auto-layout frames + kit instances +
        kit variables + text styles (no detaching, no raw values)
```

Ask the Pro Block question once per design, covering all its sections in one batch. Skip the question entirely when the user already said "from scratch", and when the session cannot ask (autonomous or non-interactive runs) default to building from scratch and name the matching block in the summary; blocking an unattended run on a question stalls the whole task.

Prefer the specific component: a labeled input is `Field`, a menu row is `Item`, an empty state is `Empty`. Check the component pages before composing by hand.

## Kit mechanics

- **Variants**: set `Variant` / `State` / `Size` together as one property string; one axis alone can name a combination that doesn't exist and fail. Leave `State=Default`; other states are documentation.
- **Content**: text via TEXT props, visibility via `Show <X>` booleans, nested overrides via instance-swap props.
- **Icons**: only IconPlaceholder instances. It nests one instance per included library (a customer file may have just one), with visibility bound to `icon-library/*` booleans; that binding is what restyles icons. Swap on the visible library's instance-swap prop. Never paste raw SVG, it bypasses the binding.
  - Never leave the default icon. IconPlaceholder's visible child is the current library's icon; set it to the instance that matches the context. A Button labeled "Star" gets `{Icon Library} / Star`.
  - Never two icons in one Button. One button, one purpose: the "Star" Button gets a single Star icon on the right. (A dropdown trigger is the one exception: leading glyph plus trailing chevron.)
  - Icon components are named `<Library> Icon / <PascalCaseName>` with no separators in the name part: `Lucide Icon / ChevronDown`, never `chevron-down`. To match a kebab-case name, lowercase it and strip hyphens. Resolve every icon the design needs in one `findAllWithCriteria` pass over the library page and return the ID map; per-icon lookups cost a round trip each.
- **Groups**: use the group component and duplicate items inside its Slot; never assemble item instances by hand. Tabs (TabsTriggers live in its Slot), not loose TabsTriggers grouped together; AvatarGroup, not stacked Avatars; Breadcrumb, not loose BreadcrumbItems. Exception: Buttons. Place separate Buttons with proper spacing between them; ButtonGroup is only for the zero-gap case.
- **Sidebar navs**: stack `SidebarMenuButton` instances directly in an auto-layout column at `FILL` width, with `SidebarGroupLabel` for section headers; SidebarGroup slots are optional, and stacking keeps per-row icon swaps simple. On `Type=Simple` the `Dropdown` and `2nd Icon` booleans render nothing, so a row that discloses (trailing chevron) must use `Type=Collapsible`. The active row is `State=Active`; never fake it with a hand-painted fill.
- **Tables**: always the Table component, editing its contents inside the Slot. Never build a table from frames.
- **Logo**: use the brand Logo instance if the file has one, otherwise the ShadcnDesign Logo instance.
- **Never**: detach an instance (freezes the style, orphans the customer from updates), hardcode a color/radius/font, or leave a frame with the default white fill (it glares in dark mode).

## Colors

- Always use color variables from the **Mode** collection. Never use raw color values.
- Use each variable for its intended purpose:

| Variable | Usage |
|---|---|
| `background` / `foreground` | Page background and default text |
| `card` / `card-foreground` | Card surfaces |
| `primary` / `primary-foreground` | Primary buttons and actions |
| `secondary` / `secondary-foreground` | Secondary actions |
| `muted` / `muted-foreground` | Muted and disabled states |
| `accent` / `accent-foreground` | Hover and accent states |
| `destructive` / `destructive-foreground` | Errors and destructive actions |
| `border` | Default border color |
| `input` | Form input borders |
| `ring` | Focus ring color |
| `chart-1` to `chart-5` | Charts and data visualization |
| `sidebar-*` | Sidebar-specific colors |
| `surface` / `surface-foreground` | Secondary surfaces |

- Pick the variable by role, not by how it looks; only the variable survives a mode switch.
- Percentage tints use the `alpha/*` and `custom/*` tokens where they exist; in kit 3.0 they are aliases with opacity on a base token (`custom/primary-muted` is `primary` at 5%, `alpha/90` is `background` at 10%), so they restyle with the theme. Where none fits, bind the base Mode variable and set the paint's opacity; never a literal color.

## Typography

- Always apply text styles to text layers. Never style text manually. Text styles carry the per-style font family and sizes; they carry no color, so bind the text fill separately.
- Cap body text at around 65 characters per line. Full-width lines are tiring to read.
- Loosen letter spacing on uppercase labels. Default tracking on all-caps looks cramped.
- Use sentence case in UI copy, not Title Case. Title case on long labels reads like a legal document.

## Spacing and layout

- Every container is auto-layout.
- Use `spacing/*` variables from the **Tailwind** collection for gaps, widths, heights, and padding. Never guess values. Stay on the Tailwind 4px scale.
- Use `radius/*` variables from the **Style** collection for corner radius. Required: some styles are zero-radius, and only bound radii collapse with them.
- Page frames: 1440 desktop, 360 mobile.
- Group by proximity: related elements sit closer together than unrelated ones. A label and its input might be 8px apart, while two separate form fields should be clearly further apart, for example 24px. If users can't tell what belongs together at a glance, the spacing is too uniform.
- Nested radii: inner radius = outer radius minus padding. Reusing the parent radius on an inner card creates a visibly wrong gap at the corners.
- Group large sets of options. Forty settings on one flat, scrollable page buries everything equally. Use sidebar navigation and progressive sections instead.
- Stay consistent with existing screens. Always check current components and screens for spacing and hierarchy patterns before designing something new.

## Hierarchy and actions

- One primary action per view. If three buttons carry equal visual weight, none of them reads as the next step.
- Button hierarchy: one primary, one secondary, one ghost or text link. Demote everything that isn't the main action.
- Hierarchy is subtraction. Make the important element stand out by letting everything else recede, not by making everything louder.
- Never place a destructive action directly beside a confirming one, for example "Delete account" next to "Save". Proximity implies equivalence, so separate them with whitespace and a visual break.
- Use tabs only for different views of the same thing. "Day / Week / Month" on a calendar is the ideal case; "Profile / Security / Integrations" is acceptable but borderline since each tab holds different content.

## Copy and microcopy

- Be specific. "Create project" beats "OK", and "Send invitation" beats "Submit". Specificity builds trust.
- Label buttons with the concrete outcome of the action: "Download PDF", "Archive 3 items", "Publish post".
- Error messages tell users how to fix the problem: "Password must be at least 8 characters", not "Invalid password". "This username is already taken, try another one", not "Error 409".
- Error pages explain what went wrong and offer a specific recovery action. "This page was moved or deleted. Go to your dashboard or search for it below" keeps the journey going; "Oops, something went wrong" ends it.
- Empty states give context and a next step: "No invoices yet. Create your first invoice to start tracking payments", not "No data".
- Placeholder text is not a label. It disappears as soon as the user starts typing, right when they need the reminder. Use a persistent label above the field, for example a "Work email" label with "name@company.com" as the placeholder.
- Name things by the user's mental model, not internal jargon: "Remember me on this device", not "Persist session token". "Sync contacts automatically", not "Enable CRM polling".
- Front-load the important word: "Payment failed. Update your card to continue", not "We were unable to process the most recent transaction on your account due to a payment issue".
- Drop "please" from imperative UI copy: "Select a plan", not "Please select a plan to continue".

## Placement and dark mode

- New designs go on the current page or a new one, never on the kit's component or block pages.
- Dark version: duplicate the finished frame and set its `Mode` collection to `Dark` using [scripts/dark-check.js](scripts/dark-check.js). Never repaint colors by hand.
- The same script is the dark verification check. If the user asked for a dark version, keep the duplicate and rename it; otherwise delete it after the screenshot so the page holds exactly what was requested.

## Verify

Screenshot the result and check:

1. No clipped or overflowing auto-layout at the breakpoint.
2. Duplicate to Dark ([scripts/dark-check.js](scripts/dark-check.js)): white boxes or unreadable text mean an unbound fill. Exemption: the Aspect Ratio component's baked placeholder image stays light by design.
3. Every element uses variables and styles, never loose values: fills, strokes, and radii show variable names, and every text layer shows a text style (for example `text-xs/leading-normal/normal`). Anything showing a raw value gets rebound. An instance with no visible background may be the style's own design; check its `component/*` variable before treating it as a bug.
4. Every icon is an IconPlaceholder with the context-matching icon selected, not the default.

If the request named specific content (copy, data, nav items), confirm it all appears. Placeholder copy is not the requested design.
