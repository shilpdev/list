---
name: pro-blocks-brand
description: "Apply a customer's brand to a Next.js Pro Blocks project: interview or ingest brand materials, propose a theme, then rewrite the shadcn tokens, radius, fonts, and Pro Blocks heading/section utilities in globals.css. Use only when the user explicitly asks to apply/set up their brand, theme, or visual identity; it rewrites the project's theme CSS."
---

# Brand a Pro Blocks project

Turn a brand into the project's theme: shadcn color tokens (light + dark), radius, fonts, and the Pro Blocks display layer (`heading-*` utilities, section rhythm). Blocks are token-pure, so this one edit re-skins every installed and future block, which is also why nothing is written before the user approves a concrete proposal.

Works on the theme the `@shadcndesign/styles` install created in the project's global CSS. That CSS missing → run `pro-blocks-setup` first.

## Step 1: Ingest the brand

- **Materials provided** (brand book PDF, screenshots, a live site URL, existing CSS): extract concrete values: hex codes, font names, radius character, spacing feel.
- **Nothing provided**: interview. Either way the interview fills what materials leave open; push back on vague answers ("modern and clean" is not a color), and propose a concrete default with every question:

1. **Primary** color and what carries it (buttons? links? both?). Check contrast immediately: primary vs. its foreground ≥ 4.5:1. Propose the passing foreground (white or near-black), don't discover it later.
2. **Neutrals**. Never invent gray values: pick ONE Tailwind neutral ramp, cool (`slate`, `gray`, `zinc`), pure (`neutral`), warm (`stone`), from the brand's temperature, and derive every surface token (`background`, `card`, `muted`, `border`, `input`, dark counterparts) from that ramp's actual steps. One ramp keeps all surfaces hue-consistent; that's what makes a theme read as designed.
3. **Secondary / accent**: a real second color, or tints of primary?
4. **Destructive**: keep the default red or a brand red?
5. **Radius character**: sharp (0), subtle (~0.375rem), soft (~0.625rem), round (1rem+)?
6. **Fonts**: sans (body/UI) and, separately, **display** (headings): same family or a distinct one? Must exist on Google Fonts or as files the user has. Verify before proposing.
7. **Display voice**: the `heading-*` utilities carry weight `500/600` and `-0.025em` tracking by default; does the brand want its headings heavier/lighter, tighter/looser, or a different case? This is half the brand's voice in these blocks. Ask, don't inherit silently.
8. **Density**: default section rhythm is 6rem desktop / 4rem mobile (`section-padding-y`); airier or tighter?
9. **Dark mode**. Always ask explicitly: does the brand define dark colors? If not, walk the decisions (background: near-black neutral vs. brand-tinted; does primary hold or lighten for contrast; how card/popover step up) and propose derived values. Never silently invent the dark palette.

## Step 2: Propose, then wait

One proposal: full token table light AND dark (all shadcn tokens: `background`…`sidebar-*`, `chart-1..5`), radius, font plan, heading spec (family/weight/tracking per size), section rhythm. Flag every contrast compromise. Iterate until an explicit "apply it", then write.

## Step 3: Apply

All colors in **oklch**. Convert with the bundled script, not mental math:

```bash
node <path-to-this-skill>/scripts/convert-colors.js oklch --batch <tokens.json>   # {"name":"#rrggbb[aa]"} → oklch
```

1. **Tokens**: rewrite `:root` and `.dark` values in the global CSS. Touch values only. Leave the file's structure, `@theme inline` mappings, and utility definitions in place.
2. **Radius**: set the base `--radius`; check how the file derives the scale (calc lines vs. literals) and keep derived values consistent with the chosen character (a 0-radius brand needs the derived values actually reaching 0).
3. **Fonts**: wire via `next/font` in `layout.tsx`, following the wiring convention already in the file (which variable names the CSS consumes; check before writing). A distinct display font gets its own variable, consumed by the `heading-*` utilities' `font-family`.
4. **Headings**: edit the `heading-xl…sm` utility definitions per the approved spec: family/weight/tracking, preserving the responsive size structure (desktop + `max-width: 40rem` overrides) unless the spec changes sizes too.
5. **Density**: if approved, adjust `section-padding-y` (and `section-title-gap-*` proportionally) in both breakpoint variants.
6. Never edit block files to express the brand; a brand that needs a block edited means a token or utility is missing, and the fix belongs in the CSS.

## Step 4: Verify

1. `next build` passes.
2. Render a real page (or a scratch page stacking a hero, a feature section, and a footer) in **light and dark**, mobile and desktop: headings show the display font and weight, surfaces are one ramp, primary carries the brand color with readable foregrounds, rhythm matches the approved density.
3. Spot-check the written oklch values round-trip to the approved hex (the script's output is exact; the check catches transcription slips).
4. Report: tokens written (light/dark counts), heading spec applied, fonts wired, density changes, contrast compromises accepted, and anything deliberately left default.
