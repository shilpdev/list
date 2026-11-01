---
name: shadcn-design-update
description: Bring a newer release of the shadcn/ui kit for Figma (shadcndesign.com) into a customer's existing kit file, two jobs. (1) New components, rebuilt natively in the customer's file, never copy-pasted. (2) Variables, migrating a kit 2.x file's color variables to the kit 3.0 model in place (Tailwind v4 palette, base tokens aliasing the palette, custom/* and alpha/* tints as aliases with opacity) while keeping the customer's own colors. Use when the user asks to update their kit, sync a new kit version, add components from a new release, migrate variables to 3.0, or adopt the new color / alias-with-opacity model.
---

# Update a shadcn/ui kit for Figma from a new release

Kit updates arrive as **new files**. Copy-pasting components across files drags foreign variables and styles along, so instead you **rebuild** each new component natively in the customer's kit (the *target*), bound to the target's own variables, text styles, and nested components, indistinguishable from a component that shipped with their file.

Two jobs, run separately or in one session (variables first, then components):

- **Components**: new component pages that exist in the source release but not in the target (Steps 1 to 5). Never modify or replace the target's existing component sets: customer design files hold instances of them.
- **Variables**: migrate a kit 2.x target (`meta/version` 2.0 to 2.2) to the kit 3.0 color model in place (the Variables migration section at the end). Only values that still match the stock kit are converted; the customer's own colors stay literal and are reported.

## Inputs

1. **Source**: link to the user's **own copy** of the new kit release, the file they downloaded from the shadcndesign.com Customer Portal and added to their Figma account. A shadcndesign.com preview/demo link is not a valid source (it's not a file in their account); if the link looks like a public preview, tell the user to download the release from the Customer Portal first and link that copy.
2. **Target**: the customer's kit, the open file (Figma agent) or a second link (MCP).

Missing either one → ask before doing anything else.

## Environment

- **Figma agent**: works in the open target file; read the source via its link.
- **Figma MCP** (Claude Code / Cursor): load the `figma-use` skill before any `use_figma` write. Mandatory. Both files are addressed by file key from their URLs. Plugin API traps that break rebuilds:
  - `get_metadata` on a file root silently truncates the page list; enumerate pages via `figma.root.children`.
  - Scripts are atomic (a failure changes nothing; fix and retry); keep them ≤ ~10 logical operations, one page-switch per script, return every created node id.
  - New frames default to an opaque white fill; set `fills = []` on every structural wrapper (invisible on light, glaring in dark).
  - `setBoundVariableForPaint` returns a *new* paint; capture and reassign. Paint opacity IS preserved through binding (pass `opacity` on the paint you bind; the kit itself uses bound paints at 30% for checked borders).
  - Reassigning a bound fill several times within one script can leave the renderer painting the fallback color while the API reports the correct binding; screenshots betray it (fallback-black chips, "inverted" text). Heal by reassigning the fill once more in a separate script; trust the screenshot over the data model.
  - Add all component properties **before** `combineAsVariants`; set variant props together (`{Variant: "outline", Size: "sm"}`); a partial set can name a combination that doesn't exist and throws.
  - Instances are named after the component **set**, not the variant. Load every font (family + style) before any text mutation; apply text styles with `setTextStyleIdAsync`.
  - `resize()` before setting sizing modes; `HUG`/`FILL` are only valid after `appendChild` into an auto-layout parent.

## Step 1: Diff the releases

1. List both files' pages. Component pages sit after the `Default shadcn/ui components ↓` divider, one component per page; check the Pro Blocks and Utility Components pages too. Read `meta/version` in each file's Style collection to confirm source is actually newer.
2. New components = source component pages (and Pro Block sets) with no counterpart in the target. Match by name, tolerating the customer's renames; check a page's component set names before declaring it missing.
3. Present the list to the user and let them pick which to bring over. Also ask the scope per run: **full page parity** (component set + variant-grid documentation + docs frame with Playground, like an official page) or **component set only**. Wait for their choices.

## Step 2: Extract the source spec (read-only)

For each chosen component, from the source file:

- The component set(s): variant matrix (every `Variant`/`State`/`Size` combination and the grid positions), component property definitions (TEXT props like `Button Text`, BOOLEAN `Show <X>` props, INSTANCE_SWAP props) and which child layers reference them, layer structure and names, auto-layout values.
- Every bound variable **by name** (`component/<x>/bg`, `radius/lg`, `spacing/2`, Mode-collection color tokens) and every text style by name. Names are the bridge between files; never carry raw values or ids across. Three binding classes hide from a naive dump and each one you miss breaks restyling:
  - **Effect styles** (`node.effectStyleId` → e.g. `focus/default`, `shadow/component/control`): the kit's focus rings and control shadows are shared styles whose spread/offset bind per-style variables; recreating them as literal effects freezes one style's values. Read the style name and re-apply the target's style of the same name.
  - **Text-property bindings** (`boundVariables.fontSize/fontFamily/fontWeight/lineHeight`) are **array-valued**; a filter that skips arrays silently drops them. Kit text nodes bind these even when a text style is applied (e.g. a `label-size` override on top of `text-sm`).
  - **Soft-deleted variables**: a bound reference can point at a variable absent from `getLocalVariablesAsync` (deleted but still referenced). `getVariableByIdAsync` still reads it; recover its name and values that way, and recreate it as a live variable in the target.
- Nested component usage: IconPlaceholder, Button, Spinner, `_Docs / Header` / `_Docs / Footer`; note which and with what overrides.
- If full parity was chosen: the variant-grid wrappers (purple `#9747FF` dashed cells, labels) and the docs frame (header, Playground with Light/Dark examples and their per-instance prop overrides, footer): geometry and content.

Build child component sets before the sets that instance them.

## Step 3: Inventory the target and create missing variables

1. Map every variable name and text style name from the spec to the target's local ids. Nested components: find the target's own IconPlaceholder/Button/Spinner/docs components by name.
2. Variables the target lacks (typically a new `component/<name>/*` namespace) get created in the target's Style collection, with a value **per mode the target actually has**; match modes to the source by name, and modes the customer deleted simply don't get values (never re-add them):
   - Stock modes present in the target: copy the source's per-mode values; aliases are recreated as aliases to the target's variable of the same name.
   - Extra modes (the customer's brand mode): aliases resolve automatically; nothing to do. Kit 3.0 aliases with opacity (`custom/*` and `alpha/*` as `COMPOSE_COLOR` expressions) are recreated as expressions pointing at the target's variable of the same name and resolve per mode on their own. Literals with baked alpha (every tint in kit 2.x files, and the six literal custom tokens in 3.0) are recomputed from the brand mode's own base tokens (destructive @ 10% uses the *brand's* destructive), mirroring the mode the brand was duplicated from. A literal you can't trace to a base token: copy from the brand's parent style and flag it in the report; never guess a brand value.
3. Missing text styles or fonts: create the text style from the source's definition; a font the target file can't load → stop and ask.

## Step 4: Rebuild in the target

1. Build one fully-wired master per structural branch: all layers named as in the source, auto-layout matching, every fill/stroke/radius/spacing bound to the *target's* variables, text styles applied, component properties defined and referenced.
2. Clone the master per variant and adjust what the variant changes. Name each `Prop=Value, Prop2=Value2`, then `combineAsVariants`, reposition to the source's grid, and match the source's default variant and set description.
3. Place the result on a new page named exactly like the source's page, positioned to match the source file's page order. Full parity scope: rebuild the Components section, variant grids, and docs frame too; copy the docs chrome conventions (radius, shadow, explicit Light/Dark modes) from one of the *target's* existing component pages, not from the source, so the page matches the customer's file.

## Step 5: Verify, identical or not done

"Identical" means identical **structure and bindings**, not identical pixels: the two files may not share a single Style mode (customers delete stock styles and keep only their brand), and then the same component legitimately *renders* differently in each file. Structure is the ground truth; pixels are only evidence where both files can render the same mode. Treat any difference as a defect:

1. **Structural parity: the primary check, valid regardless of which modes exist.** Diff the rebuilt component against the source spec from Step 2, name by name: layer tree and layer names; every variable binding on every property (fills, strokes, radii, spacings, per-side stroke weights, text fontSize/fontFamily/fontWeight, effect fields) bound to the *same-named* variable; text styles and effect styles applied by the same names; the full variant matrix, component property definitions, and which children reference which properties. `get_variable_defs` on both sets is the fast cross-check: the two name lists must mirror each other, with only intended differences (the target's own fonts/brand values).
2. **Screenshots, mode-matched.** Render source and rebuild in a Style mode **both files have** (match by `meta/style-name`) and compare every variant row; if it looks different in the same mode, it *is* different. No shared mode (brand-only kit): screenshot the rebuild in the customer's mode and inspect it alone for breakage: collapsed layout, invisible text, fallback-black fills, not for likeness to the source's render.
3. **Dark check**: view the rebuilt set with the Mode collection set to Dark; stray white fills and unbound colors only show here. Compare against the source's own dark render where a shared style mode exists; some kit components have dark quirks of their own, and matching the source's quirk is correct.
4. **Restyle check**: switch a rebuilt instance to a second Style mode (and the brand mode if present): a component that doesn't restyle has a hardcoded value; find and bind it. Only one mode in the target: this check is covered by structural parity (bindings by name), so skip it rather than inventing a mode.
5. Delete any parked/probe nodes left on the page.

Report: components added, variables created (and which brand-mode values were derived vs. copied-and-flagged), fonts/styles added, and every known deviation.

## Variables migration: kit 2.x to the 3.0 color model

Kit 3.0 (September 2026) redefined every color in the file without touching the components. A 2.x target keeps working as it is, so this is opt-in; run it when the user asks to update their variables, adopt the new color model, or migrate to 3.0. Source is the user's own copy of the 3.0 kit; target is their 2.x kit. Confirm with `meta/version` in both Style collections (target `2.x`, source `3.0`); a target already at `3.0` needs nothing.

What 3.0 changed, so you know what you are producing:

- Tailwind collection: every `colors/{family}/{step}` holds the sRGB hex of Tailwind CSS v4's oklch value (185 of 286 changed; red-500 `#fb2c36`, neutral-400 `#a1a1a1`).
- Style base pairs `color/light|dark/{token}` (31 per theme) alias the target's own Tailwind variables; the stock kit sits on `neutral` plus `colors/white` / `colors/black`, `destructive` on red-600 / red-400, light `muted-foreground` on zinc-500. Tokens with transparency (dark `border` white @ 10%, dark `input` white @ 15%, dark `ring` neutral-500 @ 57%, `sidebar-ring` @ 64%) are aliases with opacity.
- `color/light|dark/custom/*` and `alpha/*` are aliases with opacity over a base token of the same theme (`primary-muted` = `primary` @ 5%, `alpha/90` = `background` @ 10%), over a Tailwind variable where no base token fits, or `colors/transparent` at 0%. Six customs stay literal (`secondary-hover` and `tinted-hover` in both themes, dark `tinted`, dark `destructive-ring`). Shadow colors stay literal.
- The value shape: `{type: 'VARIABLE_EXPRESSION', expressionFunction: 'COMPOSE_COLOR', expressionArguments: [{type: 'VARIABLE_ALIAS', id}, percent]}` with a literal percent (0 to 100); it is accepted by `setValueForMode` and read back from `valuesByMode`. Resolve it as the base color with alpha multiplied by percent / 100. Adding an `opacity` key to a plain alias is rejected.

### Preflight

1. Ask the user to save a named version of the target (or work in a branch). The migration rewrites the Style collection's color values in every mode.
2. Snapshot: resolve every `color/*` variable of the target to rgba in every Style mode (follow aliases per collection mode; Mode-collection aliases resolve Light for `color/light/*` and Dark for `color/dark/*`). Keep it outside Figma; it is the only way to prove nothing drifted.
3. Read the source's Tailwind values and, per source Style mode, the source's resolved rgba and value shape for every `color/*` variable. Match modes to the target by name. Target modes with no source counterpart (the customer's brand mode) go through the customization rules only.

### Rules, applied cell by cell (variable x Style mode)

Skip any target cell that is already an alias to a Mode or Style variable or already an expression (`warning-*`, `field-border`, `control-border`, `badge-text-hover-muted`, anything the customer aliased). Never touch `component/*` variables (they alias Mode tokens and resolve on their own) or shadow colors.

1. **Tailwind palette.** For every target `colors/*` variable whose name exists in the source, write the source's value. Variables the customer added keep their values. This is a value change only; every alias into the palette follows.
2. **Stock cell.** If the source has a mode of the same name and the target's snapshot rgba is within 4/255 per channel of the source's resolved rgba with the same alpha (within 0.002), the cell was never customized: write the source's value shape translated by variable name (alias to the target's variable of the same name; expression over the target's variables of the same names, same percent). This reproduces the stock kit's normalization (zinc-900 `#18181b` becomes neutral-900 `#171717`, the Tailwind v3 reds become `destructive`, and so on) exactly as the 3.0 file did it.
3. **Customized base token** (`color/light|dark/{token}`, no match in rule 2, or a brand mode): if the rgb is within 3/255 of a target Tailwind step, alias it, preferring `colors/white` / `colors/black`, then `neutral`, then `zinc`, then the closest other family; with alpha below 1 write the expression `COMPOSE_COLOR(alias, round(alpha x 100))`. Otherwise keep the literal and list it in the report as a brand color. Never snap a color that is not within tolerance.
4. **Customized tint** (`custom/*`, `alpha/*`, no match in rule 2): alpha 0 becomes an alias to `colors/transparent`. Otherwise find its base in the same theme: prefer the token the name points at (`primary-*` and `selected-wash` to `primary`, `destructive-*` to `destructive`, `field*`, `track*` and `switch*` to `input`, `focus-ring*` to `ring`, `menu-border*`, `*-wash`, `ring-chart*` and `ring-faint` to `foreground`, `muted-*` to `muted`, `border-soft` and `menu-separator` to `border`, `alpha/*`, `menu-glass` and `kbd-overlay` to `background`), accepting it when the tint's rgb is within 3/255 of that token's migrated rgb or equals its pre-migration rgb; else any base token of the theme by the same test in the order background, foreground, primary, muted, accent, secondary, border, input, ring, destructive, card, popover, sidebar; else a Tailwind step within 3/255. Only tokens that are opaque in every mode may serve as a base (composing over a token that already carries alpha compounds it). Write `COMPOSE_COLOR(alias(base), round(alpha x 100))`, or a plain alias at 100%. No base: keep the literal and report it.
5. **Version.** After every write succeeded, set `meta/version` to `3.0` in every Style mode. The Figma to shadcn/ui plugin then reads the file as 3.0 (its Settings badge shows "Detected: kit v3.0 (8 styles)").

On the MCP path write in chunks of one variable group per script (base pairs, then customs, then alphas), return the mutated variable ids, and re-run the snapshot after each chunk: every changed cell must be within 4/255 per channel with identical alpha, except the stock normalizations rule 2 produced. Anything else is a bug; stop and inspect before the next chunk. Re-running is safe: cells that already hold an alias or expression are skipped.

### Verify and report

1. Re-resolve every `color/*` cell and diff against the snapshot; list the deltas by variable with old and new rgba.
2. Screenshot a component page (Button is a good one) in light and dark, and in the customer's brand mode if there is one; look for fallback-black chips, invisible text, and lost tints.
3. Report: palette values updated; base cells converted per rule (2 vs 3) and literals kept with their values; tints converted (with base and percent) and literals kept; brand modes handled; the `meta/version` bump. The literals kept are the customer's decisions, not guesses; never invent a base for them.

