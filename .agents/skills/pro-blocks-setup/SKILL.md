---
name: pro-blocks-setup
description: "Set up shadcndesign.com Pro Blocks (premium) in a Next.js + shadcn/ui project: registry config, license key, styles, and a verified test install. Use when the user asks to set up, install, or configure Pro Blocks, or when a @shadcndesign registry command fails with 401/403/404 (suggest running this to repair the setup)."
---

# Set up Pro Blocks

Configure a customer's project to install premium Pro Blocks from the shadcndesign.com registry, and **prove it works before declaring done**. A setup that hasn't installed a real block is a guess, and the failure modes (bad key, wrong URL, unloaded env) all surface only on the first install.

Pro Blocks are **Next.js-only** (blocks use `next/image` and client components). Not a Next.js project → stop and say so; don't improvise a port.

## Step 1: Preflight

1. Confirm Next.js (`next` in `package.json`) and shadcn/ui (`components.json` exists). No `components.json` → offer to run `npx shadcn@latest init` first and continue after.
2. Read `components.json`: note existing `registries` (don't clobber other registries) and the `style` field; the registry serves Radix or Base UI variants automatically based on it.

## Step 2: Registry config

Merge into `components.json` (preserving everything else):

```json
"registries": {
  "@shadcndesign": {
    "url": "https://www.shadcndesign.com/api/registry/styles/{style}/{name}",
    "headers": {
      "X-License-Key": "${SHADCNDESIGN_LICENSE_KEY}"
    }
  }
}
```

`{style}` and `{name}` are literal placeholders the CLI fills in. Never substitute them yourself.

## Step 3: License key (never through chat)

The key is a paid secret; it must not pass through the conversation, where it would land in logs.

1. Ensure `.env.local` exists with the line `SHADCNDESIGN_LICENSE_KEY=` (empty value). Never overwrite an existing non-empty value.
2. Verify `.gitignore` covers `.env.local` (Next.js default `.env*` does); add it if not; a committed key is a leaked license.
3. Ask the **user** to paste their key into `.env.local` themselves; it's in the Customer Portal on shadcndesign.com (also in the purchase email). Tell them the shape to expect: `SD-…` for Polar.sh purchases, `lsk_…` or a UUID for Lemon Squeezy; the registry auto-detects the provider.
4. When they say it's in: check the value is non-empty and roughly key-shaped **without printing it** (read the file, report only "present, looks like a Polar/Lemon Squeezy key" or "still empty"). If they paste the key into chat anyway, don't echo it back; write it to `.env.local` and recommend rotating it in the Customer Portal, since it's now in the conversation log.

## Step 4: Styles

```bash
npx shadcn@latest add @shadcndesign/styles
```

This installs the theme utilities every block depends on (`heading-xl…sm`, `container-padding-x`, `section-padding-y`, `section-title-gap-*`) into the project's CSS. Skipping it is the classic "blocks render unstyled" cause.

## Step 5: Prove it with a probe

```bash
npx shadcn@latest add @shadcndesign/tagline
```

Tagline is tiny and 144 blocks depend on it anyway. The probe leaves something useful behind. Success = the file exists at `components/pro-blocks/landing-page/tagline.tsx` and its imports resolve. Then diagnose by symptom, not by guessing:

| Symptom | Cause → fix |
|---|---|
| `401` / `403` | Key invalid, expired, or for the wrong provider. Have the user re-check the key in the Customer Portal and re-paste into `.env.local`. |
| `404` | Registry URL typo. Re-check Step 2 character for character (including the literal `{style}/{name}`). |
| Auth error though the key is in `.env.local` | The CLI didn't load the env. Confirm the file is named exactly `.env.local` in the project root, and the `components.json` header reads `${SHADCNDESIGN_LICENSE_KEY}` verbatim. |
| Install succeeds, blocks render unstyled | Step 4 skipped or its CSS not imported. Verify the styles landed in the project's global CSS. |
| Network/timeout | Registry unreachable. Retry; if persistent, check status with shadcndesign.com support. |

Fix and re-run the probe until it passes; setup isn't done while the probe fails.

## Step 6: Report

Tell the user: what was configured (registry entry, env, styles), that the probe block installed and where, and how to install blocks from now on (`npx shadcn@latest add @shadcndesign/<block-name>`, discover names with `npx shadcn@latest search @shadcndesign -q "<topic>"`). Suggest the `pro-blocks-page` skill for building full pages.
