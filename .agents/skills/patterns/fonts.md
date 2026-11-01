# Fonts

## Purpose

Use fonts consistently while building the frontend and keep font traffic off our own hosting.

## Rules

1. Always use [Google Fonts](https://fonts.google.com/) unless asked otherwise.
2. By default use `Google Sans Flex` for display and body fonts.
3. By default use `Google Sans Code` for monospace fonts.
4. Always serve fonts from the Google Fonts CDN (`fonts.googleapis.com` / `fonts.gstatic.com`). Never import them into the codebase by any means.
   - **Why:** fonts should be served from Google's CDN instead of our deployments on Vercel or AWS, which reduces our bandwidth usage.
   - Do not: download font files, commit them to the repo, use `@fontsource/*` or other font npm packages, or use framework font optimizers that self-host (`next/font/google`, `@nuxt/fonts`, `@nuxtjs/google-fonts` with `download: true`). These copy the font files into the build and serve them from our deployment.

## Setup

Add the Google Fonts CDN to the document `<head>` (in the root layout, e.g. `app/layout.tsx` for Next or `nuxt.config` `app.head` for Nuxt):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex&family=Google+Sans+Code&display=swap"
  rel="stylesheet"
/>
```

- Request only the families and weights the project uses (e.g. `family=Google+Sans+Flex:wght@400..700`).
- Do not use `@import url(...)` in CSS for this; the `<link>` tag loads faster.

## Using the fonts

Define them as theme tokens. With Tailwind CSS (v4):

```css
@theme {
  --font-sans: "Google Sans Flex", sans-serif;
  --font-display: "Google Sans Flex", sans-serif;
  --font-mono: "Google Sans Code", monospace;
}
```

With plain CSS, set the same stacks in `font-family` on `body` (and on `code`, `pre` for mono).
