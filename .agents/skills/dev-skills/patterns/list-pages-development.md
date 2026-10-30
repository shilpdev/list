# List Pages Development

> Status: stub. Patterns and snippets to be added.

## Purpose

Build list pages (data listing with pagination, search, filters, sorting) using 7Span's list packages. This skill spans multiple frameworks, so it is named by purpose instead of a framework prefix.

## Packages by framework

| Framework | Package | Documentation |
| --- | --- | --- |
| Nuxt, Vue | `@7span/vue-list` | https://7span.com/open-source/vue-list/ |
| Next, React | `@7span/react-list` | https://7span.com/open-source/react-list/ |

Pick the package from the project's framework. Never mix them.

## Rules

1. Always create a wrapper component that implements `@7span/vue-list` or `@7span/react-list` by importing all of the package's components.
2. Let the user customise how the list binds with the UI (e.g. via slots in Vue, render props or children in React).
3. The wrapper component exposes props as required.
4. Always reuse the wrapper component at all instances. Never use the package's components directly in pages.

## Snippets

_To be added._
