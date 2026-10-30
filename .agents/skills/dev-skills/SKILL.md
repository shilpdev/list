---
name: dev-skills
description: Opinionated coding patterns, technology rules, code snippets and NPM packages for developing web applications (Directus, Tailwind CSS, HTML, JavaScript, list pages, icons, file naming). Use when building or setting up web apps, then read the linked files that match the task.
---

# Dev Skills

Read the index for the area that matches the task, then the linked file.

- [Technologies index](technologies/index.md): one file per technology (CSS, Tailwind CSS, Directus, HTML, JavaScript)
- [Patterns index](patterns/index.md): cross-cutting patterns (list pages, icons, file naming)
- [Snippets index](snippets/index.md): code snippets used by the files above

## Technologies

| Technology | File | Covers |
| --- | --- | --- |
| CSS | [css.md](technologies/css.md) | Plain CSS (stub) |
| Tailwind CSS | [tailwind.md](technologies/tailwind.md) | Setup, classes and spacing, colors |
| Directus | [directus.md](technologies/directus.md) | Generate types, table creation, table naming, junction table naming, field naming |
| HTML | [html.md](technologies/html.md) | Wrapper divs |
| JavaScript | [javascript.md](technologies/javascript.md) | Null checks, reusable functions, NPM packages, readable code |

## Patterns

| Pattern | File |
| --- | --- |
| List pages development | [patterns/list-pages-development.md](patterns/list-pages-development.md) |
| Icons | [patterns/icons.md](patterns/icons.md) |
| File naming | [patterns/file-naming.md](patterns/file-naming.md) |

## Snippets

| Snippet | File |
| --- | --- |
| Directus types generation script | [snippets/directus/generate-types/script.ts](snippets/directus/generate-types/script.ts) |
| `generate:types` npm script | [snippets/directus/generate-types/package.json](snippets/directus/generate-types/package.json) |

## NPM Packages

| Package | Used by |
| --- | --- |
| `directus-sdk-typegen` | [Directus: Generate Types](technologies/directus.md) |
| `@7span/vue-list` (Nuxt, Vue) | [List pages development](patterns/list-pages-development.md) |
| `@7span/react-list` (Next, React) | [List pages development](patterns/list-pages-development.md) |
| `@iconify/react` (Next, React) | [Icons](patterns/icons.md) |
| `@iconify/vue` (Nuxt, Vue) | [Icons](patterns/icons.md) |
| `tailwindcss` (v4 or above) | [Tailwind CSS](technologies/tailwind.md) |
