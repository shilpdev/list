---
name: shadcn-design-import-style
description: "Import a style from the shadcn/ui kit for Figma (shadcndesign.com) into a project's globals.css: colors, radius, typography, shadows, and pro-blocks tokens from the kit's variables, for a style mode the user picks. Use only when the user explicitly asks to import/sync the Figma style, theme, variables, or design tokens into their code; it rewrites theme values in globals.css."
argument-hint: "[figma-url] [css-file-path]"
---

# Import a kit style into globals.css

Read the kit's **variables** (never eyeball the Style Guide page; pages drift, variables are the source of truth), let the user pick one of the kit's style modes, and write that style into the project's CSS as shadcn/ui theme tokens. Every written value must match the Figma variable it came from; Step 7 checks this, and a mismatch is a defect, not a rounding difference.

**Never assume.** A variable that doesn't fit the mappings below, a CSS file that doesn't look like shadcn's, an ambiguous font: ask the user. A wrong guess here silently reskins their whole app.

## Step 1: Inputs

- Figma file: URL in `$ARGUMENTS` (`fileKey` = segment after `/design/`) or the current desktop selection.
- CSS file: second argument, else find `app/globals.css` / `src/app/globals.css` / `globals.css`. Read it now: confirm the Tailwind v4 shadcn shape (`:root` / `.dark` token blocks + `@theme inline`). A different shape (Tailwind v3, no `@theme`) → show the user what you found and ask how to proceed before writing anything.

## Step 2: Dump the variables (Plugin API first)

`get_variable_defs` is lossy: it returns only the currently-active mode and rewrites names into CSS display form (`primary` → `var(--primary)`, `alpha/50` → `50%`). The real data comes from one **read-only** `use_figma` script:

1. `getLocalVariableCollectionsAsync()` → collections with their modes. Expect: `Tailwind` (primitives), `Style` (the style modes: Nova, Vega, Mira, Luma, Sera, Maia, Rhea, Lyra, plus any customer-created brand modes), `Mode` (Light/Dark), `Typeset`.
2. `getLocalVariablesAsync()` → for each needed variable: name, resolvedType, `valuesByMode`. Needed = the whole `Mode` collection, and from `Style`: `color/*`, `radius/*`, `font/*`, `shadow/*`, `pro-blocks/*`. Skip `component/*` (kit-internal, ~1100 vars) and the `Tailwind` primitives (they mirror Tailwind defaults).
3. Resolve aliases recursively (`{type:'VARIABLE_ALIAS'}` → look up the target in the *chosen* mode) until every value is a literal. Kit 3.0 also stores aliases with opacity: `{type:'VARIABLE_EXPRESSION', expressionFunction:'COMPOSE_COLOR', expressionArguments:[arg0, arg1]}`, where `arg0` is a color (an alias, another expression, or a literal RGBA) and `arg1` is a percentage. Resolve `arg0` to a literal the same way, then multiply its alpha by `arg1 / 100` (`primary` at 5% → primary's RGB with `a = 0.05`; `colors/neutral/500` at 57% → `a = 0.57`). Base tokens use this too, not only tints: dark `border` is `colors/white` at 10% and dark `ring` is `colors/neutral/500` at 57%. Save the dump as JSON to a scratch file. Step 7 diffs against it.

**Fallback** (no `use_figma` available): tell the user to open the file in Figma desktop and set the Style mode they want on the file, then read with `get_variable_defs`, and translate display names back (`var(--primary)` → `primary`; a bare `%` is an `alpha/*` token). Light and dark each require the user to switch the Mode collection and a re-read.

## Step 3: Ask which style

List the Style collection's actual modes (stock + custom) and ask the user which one to import. Never default silently. A branded kit's whole point is the custom mode, and the stock kit's whole point is choosing between eight.

## Step 4: Colors

1. The `Mode` collection's variable names ARE the shadcn CSS token names (`background`, `primary-foreground`, `chart-3`, `sidebar-border`, …): `<name>` → `--<name>`, `/` → `-`. Light values → `:root`, dark values → `.dark`, both resolved in the chosen style mode.
2. Convert every color with the bundled script (`scripts/convert-colors.js`, in this skill's folder); exact math, no mental conversion:
   ```bash
   node <path-to-this-skill>/scripts/convert-colors.js oklch --batch <dump.json>
   ```
   It handles 8-digit hex (`#e5000b1a` → `oklch(0.579 0.237 28.462 / 10%)`). Always oklch, the shadcn/Tailwind v4 standard. A base token that resolved with alpha (dark `border` at 10%) is written with the alpha suffix, exactly as shadcn's own dark theme does (`--border: oklch(1 0 0 / 10%)`); never drop the alpha to make it look like a solid.
3. **Kit-internal namespaces are not CSS tokens**: skip `alpha/*` and `custom/*` (they exist for Figma component internals; shadcn's CSS derives tints with `/N` opacity modifiers instead). Also skip shadcn-v3 leftovers the kit still carries (`ring-offset`); they look user-created to the namespace rule but have no v4 CSS counterpart.
4. **User-created variables**, any color in the `Mode` collection outside the standard shadcn token set and outside the internal namespaces (e.g. `tertiary`, `brand`, `warning`), carry them over: `--<kebab-name>` in `:root`/`.dark` **and** a `--color-<kebab-name>: var(--<kebab-name>);` line in `@theme inline` (without it Tailwind generates no `bg-tertiary` utility, and the token is dead). Unsure whether something is user-created or internal → ask.

## Step 5: Radius, fonts, shadows

**Radius: must match Figma 1:1, and CSS derives it with calc.** shadcn projects define `--radius` in `:root` and derive the scale with calc lines in `@theme inline`, but the formula differs by generation (older CSS: additive `calc(var(--radius) - 4px)` / `- 2px` / `+ 4px`; the 2026 CLI: multiplicative `calc(var(--radius) * 0.6)` / `* 0.8` / `* 1.4` … `* 2.6`). Never assume a formula. Evaluate the one actually in the file:

1. `--radius` = the kit's `radius/lg` in rem (px ÷ 16).
2. Read the project's own calc lines, compute what each produces with the new `--radius`, and compare token-by-token against the kit's actual `radius/xs..4xl` values. Matching → leave the calc lines untouched. Any mismatch → replace that token's calc with the explicit kit value. Concrete trap: with the additive formula, zero-radius styles (Sera, Lyra, and square brand modes) yield −4px/−2px/+4px; only explicit `0rem` values reproduce them (the multiplicative formula survives ×0).
3. Kit sizes the project's calc lines don't cover: compare against what the CSS currently produces (a project calc line or Tailwind's built-in scale) and add explicit `@theme inline` entries only for those that differ.

**Fonts**: `font/family/{sans, heading, mono}` from the chosen mode. **Follow the wiring convention already in `layout.tsx`**: conventions differ by generation and imposing the wrong one breaks the chain. The 2026 CLI sets `variable: "--font-sans"` directly in `next/font` (paired with `@theme inline { --font-sans: var(--font-sans) }`); older projects use a raw name (`--font-inter`) that `@theme inline` re-points (`--font-sans: var(--font-inter)`). Swap the font family inside whichever pattern the file uses, keeping every existing `@theme inline` font line satisfied. Other stacks: `@font-face`/import + the `@theme inline` mapping. A heading family different from sans → wire `--font-heading` the same way; a font you can't identify a webfont source for → ask.

**Shadows**: the kit stores shadows decomposed: `shadow/<size>/<layer>/{x, y, blur-radius, spread, color}`. Import only the Tailwind-scale sizes (`2xs, xs, sm, md, lg, xl, 2xl`); named component shadows (`shadow/control`, `shadow/surface`, `shadow/popover`, …) are kit-internal and have no CSS utility. Reassemble each size's layers in order into a `box-shadow` value. Write values in `:root` (mirror to `.dark`, same values unless the kit provides dark-specific ones) and map each in `@theme inline`:

```css
:root { --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
@theme inline { --shadow-sm: var(--shadow-sm); }
```

The `@theme inline` line is required: it makes Tailwind's `shadow-sm` utility read the `:root` value (and the `inline` keyword is what prevents the self-reference from being circular). A `--shadow-*` written only in `:root` changes nothing.

## Step 6: Pro-blocks tokens → utility classes

Pro Block code from the `@shadcndesign` registry references utility classes, so variables alone are not enough; emit both:

1. Tokens: `pro-blocks/{desktop,mobile}/section-padding-y`, `container-padding-x`, `section-title-gap-*`, and `pro-blocks/heading-{xl,lg,md,sm}/*` (font-size, line-height, letter-spacing, font-weight per breakpoint).
2. If the project already defines the classes (`.section-padding-y`, `.container-padding-x`, `.heading-xl`…`.heading-sm`, installed by the registry), keep their structure and breakpoints and update only the values.
3. Otherwise create them in `@layer utilities`: mobile value as the base, desktop value behind the project's `lg` breakpoint, e.g.:
   ```css
   @layer utilities {
     .section-padding-y { padding-block: var(--section-padding-y-mobile); }
     @media (min-width: 64rem) { .section-padding-y { padding-block: var(--section-padding-y-desktop); } }
   }
   ```
   Heading classes get font-size/line-height/tracking/weight the same way.

## Step 7: Verify against the dump

Do not trust the writes; prove them:

1. Re-read the finished CSS (and `layout.tsx` if fonts changed).
2. For every token written, compare against the dump JSON: colors round-trip to the same rgb/alpha, radius calcs computed out equal the kit's px values token by token, shadow strings contain every layer, each user-created color has its `@theme inline` registration, fonts resolve through the raw-variable indirection.
3. Report a summary table: token group, count written, source mode, plus everything skipped (and why) and anything the user still has to do (e.g. install a font). Any comparison that fails gets fixed before the report, not mentioned in it.
